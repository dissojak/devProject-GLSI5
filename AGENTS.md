# AGENTS.md — DeploymentPlanner AI

**This file is read automatically by agentic tools (opencode, Codex, Cursor,
Cline, …). Claude models: see `CLAUDE.md` next to it — same directive.**

## MANDATORY FIRST ACTION — before ANY code, feature, bugfix, refactor or review

1. Load and follow the installed agent skill **`backend-rules`**
   (canonical file: `backend/skills/backend-rules/SKILL.md`). It is the
   pre-work checklist: it makes you read EVERY rules file first, apply
   `docs/ocp.md` (Open-Closed Principle verified sweep), write clean code
   per `docs/conventions.md`, and prove it with `typecheck` + `lint` +
   `tests` before claiming done.
2. If the skill is not installed in your tool, READ the canonical file
   directly at `backend/skills/backend-rules/SKILL.md` and follow it to
   the letter.

Rules are the team's contract: they outrank the features requested. Silent
rule violations are merge-blockers, not style opinions.
