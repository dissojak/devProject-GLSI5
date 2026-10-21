# services/

Orchestration and cross-document rules. This is where transactions belong
(they require a MongoDB replica set, see docs/conventions.md). Services call
repositories, enforce business rules that span more than one document, and
never know about HTTP.

Dependency rule: `services -> repositories + models + domain + shared`.
services must NEVER import controllers, routes or middleware.
