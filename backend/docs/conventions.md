# Conventions — DeploymentPlanner AI backend

## Folder rules

```
src/
  config/          env contract (zod, fail fast), database connection
  domain/          framework-free primitives: enums/, errors/, value-objects/,
                   state-machine/
  models/
    entities/      exactly one file per Mongoose model + barrel index.ts
    value-objects/ shared embedded subschemas (one file per VO)
    plugins/       shared schema plugins (soft-delete, base schema options/serde)
  repositories/    one file per repository + barrel; BaseRepository lives here
  services/        orchestration: cross-document rules, transactions, audit
  controllers/     HTTP layer: parse/validate input, call services, map to DTOs
  routes/          Express routing per resource
  middleware/      request logging, 404, central error handler + status table
  shared/          crypto/, logging/, security/ (multi-layer helpers)
tests/
  unit/            pure rules (no DB): models, value-objects, domain, shared
  models/          integration specs per model (mongodb-memory-server)
  repositories/    integration specs per repository
  http/            supertest specs on the Express app
docs/              domain-model.md, conventions.md
```

## Dependency direction (enforced by ESLint rules, see `eslint.config.js`)

```
routes → controllers → services → repositories → models/entities
                                              → models/plugins, value-objects
domain/*      everything may import domain; domain imports NOTHING app-side
shared/*      importable by all layers; shared imports domain only
```

Forbidden: models importing repositories/services; repositories importing
services/controllers; `src/config/env` leaking beyond the entry points
(`server.ts`, `app.ts`, test helpers).

Operational exception (`GET /health`): must respond even when the rest of the
app is broken, so it bypasses services. The route wires
`controllers/health.controller.ts#wireHealth` and INJECTS the `getDbStatus`
getter (routes -> config is legal; controllers keep zero config imports).
This is the only endpoint allowed to skip the services layer.

## How to add a model

1. **Enums first**: add every closed set (`STATUSES`, ruled vocabularies) to
   `src/domain/enums/<name>.enums.ts` — models import enums, never inline
   string literals in fields.
2. **One file** `src/models/entities/<name>.model.ts`:
   - export `XxxFields` (no Mongoose types), `XxxMethods`, `XxxStatics`
     optionally `XxxVirtuals`, and the combined `XxxDocument =
     HydratedDocument<XxxFields, XxxMethods & XxxVirtuals>`.
   - schema generic order:
     `new Schema<Fields, BaseModel, Methods, Record<never, never>, Virtuals-or-Record<never, never>, Statics, DefaultSchemaOptions>`.
   - build models via `mongoose.model(NAME, schema)` (the named `model` export
     has no schema-inference overload); export `XXX_MODEL_NAME` for services.
   - invariants are behavior methods or `pre('validate')` hooks; never bare
     validators for cross-field rules. Embedded-VO invariants MUST guard with
     "skip when the value isn't parseable yet" (hooks run before field
     validators) and each shared subschema factory must be instantiated once
     per path.
   - use `baseSchemaOptions()` (serde: `_id`→`id`, no `__v`; timestamps).
3. **Register in the barrel** `src/models/entities/index.ts`.
4. **Tests** (`tests/models/<name>.spec.ts`): pure rules via
   `await doc.validate()` (see "Testing approach"), transitions via behavior
   methods, uniqueness/index/soft-delete behaviour against
   `connectTestingModule('<name>_test')`. Purge between tests with
   `deleteMany({}).setOptions({ withDeleted: true })` (append-only models:
   driver-level `collection.deleteMany`).
5. Run `npm run build && npm run typecheck && npm run lint && npm test`.

## Indexes

- **Declare indexes in the schema files** (field/index options), never call
  `collection.createIndex` ad hoc; models expose them via `diffIndexes()`.
- **`autoIndex` is disabled in production.** Run
  `npm run db:sync-indexes -- --apply` on every deploy — it diffs each model's
  declared indexes against the database and creates/drops the difference
  (dry-run by default; exits non-zero on failure).
- Unique/partial indexes (users.email unique, projects `(owner,name)` partial
  unique, deployment-plans `(project,version)` unique) only exist if the sync
  script ran against that database — CI and local dev should run `--apply`
  after migrations.

## How to write a state machine

- Instantiate ONE `defineStateMachine<Status>({ STATE: ['NEXT1', 'NEXT2'], ... })`
  per status field at module scope.
- Status flags are enum values from `domain/enums`; a status field is
  `required: true` with the enum list.
- Behavior methods (not services, not controllers) assert + mutate:
  ```
  MACHINE.assertTransition(current, next);   // throws InvalidStateTransitionError
  this.set('status', next);
  ...
  return this.save();
  ```
- Resting on the current state (`from === to`) is NOT a valid transition.
- The single transition error message contract:
  `Invalid state transition: cannot move from "X" to "Y"`.

## Error handling contract

- One family: `domain/errors` (`AppError` base + domain classes). Every class
  carries a stable `code` (e.g. `INVARIANT_VIOLATION`).
- Models/repositories **throw**; services decide transactional rollback;
  controllers never catch domain errors — the central `error-handler`
  middleware resolves the HTTP status from `middleware/error-status-table.ts`
  (ONE table; adding an error class = one row) and logs via `shared/logging`.
- Unknown errors become 500 `INTERNAL_ERROR`, never leaking stack traces.
- No `try/catch` inside models that swallows errors; `assert*` helpers throw.

## Testing approach

- Unit (`tests/unit`): pure invariants with `await doc.validate().catch(e => e)`
  wrapped by the shared helper (`tests/helpers/schema-validation.ts` captures
  the rejected `ValidationError.path` keys); NO database.
- **`doc.validateSync` is BANNED** (ESLint `no-restricted-properties` on src
  and tests): it is deprecated for removal in Mongoose 10, and it SKIPS
  sub-document `pre('validate')` hooks, so validation outcomes differ from
  production.
- Model integration (`tests/models`): `mongodb-memory-server` through
  `connectTestingModule`/`disconnectTestingModule` (unique db name per file);
  `await Model.init()` in `beforeAll`; purge collections in `beforeEach`.
- Repository integration (`tests/repositories`): same helpers; ordering tests
  insert with small delays when sorted by `createdAt` (millisecond resolution).
- `tsconfig.typecheck.json` covers `src/` AND all of `tests/` — every spec file
  must compile under the same strict flags (`npm run typecheck`).
- Service tests that exercise transactions need a replica set:
  `mongodb-memory-server` must run as `MongoMemoryReplSet` (single-node), since
  standalone memory servers reject `startTransaction`.
- HTTP (`tests/http`): supertest on the compiled `app` (no `listen`);
  env vars mocked/fake as needed.
## Transactions

- `BaseRepository`'s `{ session }` plumbing exists, but MongoDB transactions
  REQUIRE a replica set (Atlas out of the box, or a local single-node replica
  set: `mongod --replSet rs0` + `rs.initiate()` once). The dev/test cluster
  used by default (standalone) REJECTS `startSession/startTransaction`.
- Services open sessions, pass them down via `{ session }` and commit/abort —
  repositories stay untouched.

## API conventions

- **Prefix**: every route lives under `/api/v1`; version bump only for
  breaking changes.
- **Resources are plural nouns**: `projects`, `deployment-plans`, `forks`,
  `runs`. No verbs at the collection root (`/plans/create` is banned).
- **Reads are ALWAYS `GET`** — even "expensive" ones like analyses (a read
  with side effects such as caching stays `GET`).
- **Filters, sorting, pagination go in the query string**: `/plans?filter[state]=DRAFT&page=2&pageSize=25`
  (error and pagination bodies reuse the error/pagination envelopes already
  defined by the middleware contracts).
- **Non-CRUD actions are `POST` on a sub-path of the resource**:
  `POST /api/v1/projects/:id/approve` — never `PUT /approve` on a collection
  root; the sub-path reuses the ERROR/ownership middleware chain.
- **Ownership is resolved through the parent**: user-scoped entities are
  always nested under `/users/:id/...` or the parent project:
  `/api/v1/projects/:id/plans/:planId`; services verify the link instead of
  trusting the caller's user id.
- **Admin routes live under `/admin`** with an explicit role assertion
  middleware (`requireRole('ADMIN')`); the claim is NOT trusted from the body
  or a bare cookie.
- **Auth middleware reloads the user on every request** and then calls
  `user.assertCanAuthenticate()` (a deactivated/deleted user's tokens are
  rejected even if the record was cached earlier), instead of reading a
  trusted-user row from an earlier middleware snapshot.
- **Serde contract**: request bodies are plain JSON (camelCase), error and
  pagination envelopes as documented in `middleware/error-handler.ts` and the
  pagination helper — adding a route never invents a fourth envelope shape.
