# routes/

Versioned HTTP wiring only: URL paths, HTTP methods, middleware chains, and a
call to **one** controller function per endpoint. No business logic, no data
access, no frameworks other than Express.

Dependency rule: `routes -> controllers (+ middleware/config for wiring)`.
routes must NEVER import services, repositories, models.

Exception: `health.routes.ts` is the operational endpoint (`GET /health`); it
wires ONE controller function (`controllers/health.controller.ts`), and that
controller is the ONLY one allowed to touch `config/database` directly -
documented in docs/conventions.md.
