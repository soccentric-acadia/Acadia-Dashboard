# Acadia Dashboard

## Project Description

Acadia-Dashboard is the operator-facing web console for the Acadia validation and verification
workflow. The `webui/` package is a Next.js application with a workspace shell, dashboard,
modules catalog, run list and detail pages, live-run views, logs, reporting, AI/LLM tooling, and
settings pages for general, host OTA, and device OTA concerns. Shared chrome components provide
navigation, connection state, mode switching, help/shortcut access, and run start/stop controls.
UI types and API helpers in `webui/lib/api` model the server contract, while module catalog code
combines server data with HAL-derived definitions.

Live execution is handled through server-sent events: `useLiveRunStream`, the live-run reducer,
and its types coordinate event state, logs, progress, results, and terminal conditions. Utility
and reducer tests exist in the web package, and `contract-tests/` contains Python tests for
smoke behavior, runs, settings, and streaming against Acadia Server. A passing reducer test
validates local state transitions; the contract suite depends on a compatible backend and does
not certify visual or device behavior. Docker, API findings, an audit, and architecture guidance
are also present.

Use the Makefile or package scripts in `webui/` for install, development, build, lint, and
Vitest checks. Use the `contract-tests/` environment for backend-facing tests. Authentication,
network reachability, browser compatibility, and OTA safety remain deployment concerns requiring
explicit review.

The dashboard is consequently a client of the Server contract, not an independent source of run
truth. API failures, reconnects, empty module catalogs, long log streams, completed runs, and
authorization failures should be checked in a browser against a compatible deployment. The
repository's local tests help protect reducer and utility behavior, while the contract tests
provide a narrower compatibility signal for the backend paths they exercise.

## Documentation

- [webui/README.md](webui/README.md) — Web UI package (Next.js operator console).
- [docs/req.md](docs/req.md) — original design/build prompt for the Web UI.
- [docs/WEB_FINDINGS.md](docs/WEB_FINDINGS.md) — verified Server REST/SSE API inventory.
- [docs/AUDIT.md](docs/AUDIT.md) — independent verification audit of this repo.
-
[.claude/skills/dashboard-architecture/SKILL.md](.claude/skills/dashboard-architecture/SKILL.md)
— architecture, frontend/backend communication, and UI conventions for coding agents.

## Feature Status

| # | Name / Description | Implemented? | Test Coverage? | Manual Test |
|---:|---|---|---|---|
| 1 | Next.js application shell and workspace navigation | Implemented | Unknown | [ ] Manual verification required |
| 2 | Dashboard overview | Implemented | Contract coverage unknown | [ ] Manual verification required |
| 3 | Module catalog and workspace | Implemented | Contract coverage unknown | [ ] Manual verification required |
| 4 | Run list, details, and live run page | Implemented | Contract tests cover runs/streaming | [ ] Manual verification required |
| 5 | SSE live-run reducer and stream hook | Implemented | `webui/lib/live-run/reducer.test.ts` | [ ] Manual verification required |
| 6 | Logs and live log display | Implemented | Contract streaming test; UI unknown | [ ] Manual verification required |
| 7 | Reporting view | Implemented | Unknown | [ ] Manual verification required |
| 8 | General and OTA settings pages | Implemented | Settings contract test | [ ] Manual verification required |
| 9 | API client, shared types, and connection indicator | Implemented | Utility tests; integration partial | [ ] Manual verification required |
| 10 | Docker and contract-test workflow | Implemented | Four contract suites | [ ] Manual verification required |
| 11 | AI/LLM workspace | Partial: page exists; behavior unknown | Unknown | [ ] Manual verification required |

## Test Evidence

- `webui/lib/live-run/reducer.test.ts`, `webui/lib/utils.test.ts`.
- `contract-tests/tests/test_01_smoke.py` through `test_04_streaming.py`.
