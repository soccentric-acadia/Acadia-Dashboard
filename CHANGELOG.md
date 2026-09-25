# Changelog

## 2026-09-25 — Task 012: Live-run view contract fix (VB-5, DSH-001)

- **Parent task:** `soccentric-acadia/Acadia` `tasks/012-live-run-view-contract-fix/`.
- **User-visible behaviour:** the live-run view (`/runs/{id}/live`) can now
  connect and show streaming results. It previously 404'd on the wrong SSE
  path; inspection found the client's event-name handling, payload-type
  assumption, and its entire `run.start`/`module.transition`/`run.complete`/
  `flow.paused` event vocabulary didn't match anything the Server has ever
  sent — fixing the path alone would not have made this work.
- **Key files:**
  - `webui/lib/live-run/useLiveRunStream.ts` — path `/stream` → `/events`;
    `onmessage` → `addEventListener("state"|"result", ...)`; events tagged
    from the SSE event name instead of trusting a `type` field `result`
    payloads don't carry.
  - `webui/lib/live-run/types.ts` — real `state`/`result` event contract,
    replacing the fictional one.
  - `webui/lib/live-run/reducer.ts` — matches the real contract; the module
    list is derived purely from landed results (no `module.transition`
    event exists).
  - `webui/lib/live-run/reducer.test.ts` — rewritten, 8 tests.
  - `contract-tests/tests/test_04_streaming.py` — marked
    `pytest.mark.skip` with a reason (it also assumed nonexistent
    `POST /runs/{id}/start`/`/results`/`/complete` REST verbs).
- **Validation:** `npm ci`, `npx tsc --noEmit` (clean), `npx vitest run`
  (25/25 passed). `npx eslint lib/live-run/` shows one pre-existing,
  unrelated error confirmed via `git stash` to predate this change.
- **Known gaps:** no live run-status-change push exists server-side yet — a
  run finishing while a viewer is connected won't update that viewer until
  reconnect. The skipped contract test needs a real run-creation/dispatch
  path to rewrite properly; neither was built in this task.
