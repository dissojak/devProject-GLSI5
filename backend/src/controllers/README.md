# controllers/

HTTP translation only: pull request params/body, call services, wrap the
result in an Http response (or let domain errors propagate to the central
error handler). No business rules, no Mongoose queries, no transactions.

Dependency rule: `controllers -> services (+ domain, shared)`.
controllers must NEVER import repositories or models directly.
