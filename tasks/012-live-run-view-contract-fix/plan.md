# Task 012 — Live-run view contract fix (VB-5, DSH-001, SRV-141) — Acadia-Dashboard scope

Parent task: [`Acadia/tasks/012-live-run-view-contract-fix/plan.md`](https://github.com/soccentric-acadia/Acadia/blob/develop/tasks/012-live-run-view-contract-fix/plan.md)

## Scope in this repository

The live-run SSE client (`webui/lib/live-run/`) was built against an event
contract the Server has never implemented (`run.start`/`module.transition`/
`run.complete`/`flow.paused`, plus `onmessage`-based listening and a
`type`-field assumption that don't match how the Server's named SSE events
actually work). Beyond the documented `/stream` vs `/events` path mismatch,
the connection would never have delivered usable data even with the right
path.

## Affected interfaces / files

- `webui/lib/live-run/useLiveRunStream.ts` — path fix, `addEventListener`
  instead of `onmessage`, event tagged from the SSE event name.
- `webui/lib/live-run/types.ts` — real `state`/`result` event contract.
- `webui/lib/live-run/reducer.ts` — matches the real contract; derives
  module list purely from landed results (no `module.transition` exists).
- `webui/lib/live-run/reducer.test.ts` — rewritten, 8 tests, all passing.
- `contract-tests/tests/test_04_streaming.py` — marked `pytest.mark.skip`
  with a reason (targets a fictional vocabulary and nonexistent REST verbs);
  not deleted, not silently left as a misleading "passing" or unrun signal.

## Local tests

Real toolchain available in this session:

```
npm ci --no-audit --no-fund
npx tsc --noEmit        # clean
npx vitest run          # 25/25 passed
npx eslint lib/live-run/  # 1 pre-existing, unrelated error (confirmed via git stash)
```

## Role in cross-repository validation

Consumer-side fix. The Server's `RunsController::events` (companion PR in
`Acadia-Server`) is the provider whose real contract this now matches.
