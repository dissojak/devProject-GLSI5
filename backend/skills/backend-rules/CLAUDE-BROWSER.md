# Claude (browser) edition of `backend-rules` — self-contained, no repo access needed

**For the human:** open a NEW conversation on claude.ai, paste this whole file
as the first message, then make your feature request below it. The browser
model has no filesystem: everything it needs is inline here.

---

You are helping the **DeploymentPlanner AI** team with its backend
(Express + Mongoose + zod v4 + TypeScript, Node ESM with `.js` import
suffixes, vitest + supertest). Before answering ANY coding request you must
apply the rules in this message as the team's non-negotiable contract.

## 1. Context-free project map

```
backend/src/
  app.ts            # express assembly — imports ONLY routes/index.ts' createApiRouter
  server.ts         # the only module that listens + connects MongoDB
  routes/           # index.ts = THE composition root; per-feature routers
  controllers/      # per-feature factories: parse input, call service, send JSON
  services/         # per-feature folders: business rules (closures, NO classes)
  repositories/     # BaseRepository subclasses (queries only)
  models/entities/  # Mongoose schemas + behavior methods (User, Project, ...)
  middleware/       # require-auth, require-role, error-handler, logging
  domain/           # errors (AppError subclasses), enums, state machines
  shared/           # validation helpers, crypto, logging — importable by everyone
  types/            # cross-layer DTOs + service contracts (barrel index.ts)
  config/           # env.ts (getEnv validation), database.ts (connect helper)
  scripts/          # admin:create, db:sync-indexes, db:backfill-user-status
```

## 2. Read the request, then plan in THIS order

1. Restate the feature in one sentence and name the files you touch.
2. State which rule(s) below apply to it. If the request conflicts with a
   rule, STOP and say which one, propose the rule-abiding alternative, ask.
3. Only then write code.

## 3. Architecture rules (always)

- **Dependency direction:** `routes → controllers → services → repositories →
  models/entities` (+ everyone may import `domain/`, `types/`, `shared/`).
  Reverse imports = bug. Middleware never imports services; it takes injected
  deps typed by contracts from `src/types/`.
- **Composition root** = `src/routes/index.ts` (plus `server.ts`, `scripts`,
  test helpers). ONLY these read `getEnv()`; everything else receives
  everything as parameters. `config/database.ts` takes `connectDatabase(uri,
  { autoIndex })` from callers.
- **Feature routers** declare each endpoint inline on ONE line:
  `router.post('/', requireAuth, createCreateProjectController(service));`
  Specific literal routes mount BEFORE `/:id` routes.
- **Services** = functional factories returning closures, deps default-wired:
  ```ts
  export function createProjectService(projects = new ProjectRepository()) {
    async function create(userId: string, input: CreateProjectInput) { ... }
    return { create, list, get, update, remove };
  }
  export type ProjectService = ReturnType<typeof createProjectService>;
  ```
  No classes, no `this`, no config reads, no singletons.
- **Controllers** parse with `parseOrThrow` (shared helper):
  ```ts
  const input = parseOrThrow(createProjectSchema, req.body, 'Invalid project data');
  ```
  Inline `safeParse` + `AppError` blocks are BANNED. Id params are validated
  against the 24-hexObjectId regex BEFORE reaching Mongoose (400, not 500).
- **Model methods = one mutation, one save.** Multi-field updates go through
  ONE `applyUpdate`-style method. Ownership checks live IN the query
  (`{ _id: id, owner: userId }`) so a foreign project is "not found", not
  "forbidden" (anti-IDOR).
- **Request principal:** `res.locals.authUser` (full DTO) and
  `res.locals.userId` are set ONLY by `requireAuth`.
- **Async/await only** — never `.then()`/`.catch()` chains, never
  `new Promise` sleeps.
- **Complexity budget:** helpers ≤ cc 9; extract steps into named functions.

## 4. Open-Closed Principle (docs/ocp.md) — enforced

- **ZERO `switch`/`case` statements** in runtime code. If your answer needs
  one, you violated the rule — restructure it.
- Per-kind behavior lives in **data arrays** (e.g. `GENERATED_FILE_KINDS`,
  `KINDS_REQUIRING_PLAN`, `PROJECT_ENVIRONMENTS`, the error→status table,
  state-machine transition tables, declared indexes). Adding a kind = adding
  a data row, never editing a dispatcher.
- A THIRD branch per discriminator anywhere → extract a **strategy +
  registry**: one file per strategy, registry validates at boot
  (`verify()`), unknown keys throw a domain error, duplicate registration
  throws. With only 2 stable branches, a plain `if` is CORRECT
  (over-engineering is also a violation).
- Feature diffs are additions: new file + one registration line; never edit
  existing strategies, dispatchers, or contracts.

## 5. Errors and HTTP contracts (fixed vocabulary)

| Error class | code | HTTP |
|---|---|---|
| UnauthorizedError | UNAUTHORIZED | 401 |
| ForbiddenError | FORBIDDEN | 403 |
| AccountDisabledError | ACCOUNT_DISABLED | 403 |
| NotFoundError | NOT_FOUND | 404 |
| ConflictError | CONFLICT | 409 |
| InvalidStateTransitionError | INVALID_STATE_TRANSITION | 409 |
| InvariantViolationError | INVARIANT_VIOLATION | 500 |
| validation (parseOrThrow) | VALIDATION_ERROR | 400 |

Response shape: success `{ message, data, ...metadata }`; failure
`{ error: { code, message, details? } }`. Login returns
`{ message, data, accessToken, tokenType: 'Bearer', expiresIn }` with
`Cache-Control: no-store`. Accounts start PENDING and cannot authenticate
until approved (state machine: PENDING → ACTIVE/REJECTED, ACTIVE ↔ DISABLED,
REJECTED terminal).

## 6. Code-style rules

- TypeScript strict; `zod` v4 only (`z.strictObject`, `z.flattenError`).
- No new dependencies unless you ask first. No placeholder deps invented.
- No comments unless asked; code is the documentation. French/English match
  the surrounding file.
- Never touch `package-lock.json`, never echo secrets, never weaken tests,
  lint rules, or existing code to make things pass.
- Commit messages: atomic, prefix `Adem:` (the team's convention), body lists
  what changed and why — propose them, don't commit (no terminal).

## 7. Deliverables

When you answer with code:
1. Full file contents (or precise edit blocks) with paths from
   `backend/`.
2. A test plan: service-level + HTTP-level (vitest + supertest, memory
   MongoDB); tests are ADDITIVE (never rewrite existing tests' logic).
3. The verification commands for the team to run:
   ```sh
   npm run typecheck && npm run lint && npm test
   ```
   and the OCP sweep: `grep -rn "switch (\|case '" src/` must output nothing.
4. If you cannot verify locally (no terminal), say "unverified" instead of
   claiming green.

## 8. If anything is ambiguous

Ask ONE targeted question instead of guessing (which layer? which route?
which rule?). Silence is not consent: never silently deviate from this file.
