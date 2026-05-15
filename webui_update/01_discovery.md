# Phase 1 — Discovery

## 1. Upstream status: CONFIRMED COMPLETE

### Acadia-HAL (`protos/common.proto`)

All new types are present and correct:

- **TestStatus** — 6 canonical values: `TEST_STATUS_PASS=1, FAIL=2, ERROR=3, TIMEOUT=4, ABORTED=5, SKIPPED=7` (6 deprecated PARTIAL kept as alias). REST serialises as uppercase strings.
- **TestSeverity** — 4 values: `INFO=1, WARNING=2, ERROR=3, CRITICAL=4`.
- **TypedValue** — oneof `bool_value / int_value(int64) / double_value / string_value`.
- **TestOutput** — `reserved 1,2 ("passed","data")`. Fields: `status`, `severity`, `reason: map<string,string>`, `metrics/monitoring/event: map<string,TypedValue>`, `error_message`.
- **TestResult** — `module_id, test_id, name, sequence(uint64), timestamp(Timestamp), duration(Duration), output(TestOutput), subtests(repeated TestResult)`.

### Acadia-Server

REST endpoint `/api/v1/runs/{id}/results` serialises to:
```json
{
  "id": "string", "run_id": "string", "module_id": "string", "module_version": "string",
  "test_id": "string", "name": "string", "sequence": int64, "timestamp": "ISO-8601",
  "duration_ns": int64, "status": "PASS|FAIL|ERROR|TIMEOUT|SKIPPED|ABORTED",
  "severity": "INFO|WARNING|ERROR|CRITICAL", "error_message": "string",
  "mode": "single_shot|long_term|monitoring|event_based",
  "reason": {"key":"string"}, "metrics": {"key":{"type":"T","value":V}},
  "monitoring": {"key":{"type":"T","value":V}}, "event": {"key":{"type":"T","value":V}},
  "subtests": [...], "payload_type_url": "string", "payload_b64": "string"
}
```

**Live updates**: SSE at `GET /api/v1/runs/{id}/events`. Already used by `ws.ts` via `EventSource`. Two event types: `{type:"state", run_id, status}` and `{type:"result", run_id, result: <TestResult DTO>}`.

Additional endpoints confirmed:
- `GET /api/v1/runs/{a}/compare/{b}` — returns diff categorised by server
- `GET /api/v1/modules/{id}/results` — paginated results across all runs
- `GET /api/v1/modules/{id}/trend?test_id=&field=&from=&to=` — numeric time-series
- `POST /api/v1/runs/{id}/baseline`, `GET /api/v1/runs/{id}/export?format=csv|json`
- `GET /api/v1/runs/{id}/report` — HTML report

### Acadia-Client

Not relevant to UI changes. Speaks gRPC protos. Confirmed: stamps `sequence` and `timestamp`. Synthesises ABORTED/ERROR/TIMEOUT on HAL failure.

---

## 2. Old-shape references in `webui/src/`

Files referencing old shape (`Result.status: "pass"|"fail"|"error"|"unknown"`, flat `payload`, boolean-ish patterns):

| File | Issue |
|------|-------|
| `src/lib/api/types.ts` | `Result` has 4-value lowercase status, flat `payload`, no severity, no typed maps |
| `src/lib/api/ws.ts` | `RunSSEEvent` uses old `Result` type |
| `src/app/(shell)/runs/[runId]/page.tsx` | `r.status === "pass"` comparisons; renders `r.payload` as JSON; no severity, no typed maps |
| `src/components/runs/run-state-badge.tsx` | Only 6 `RunStatus` values; test result Status is separate |

Grep verification (expected to zero out after changes):
- `r.status === "pass"` — 1 hit in run detail page
- `r.payload` — 1 hit in run detail page
- No `\.passed\b` hits found

---

## 3. Components / hooks / pages consuming result data

- `src/lib/api/types.ts` — defines `Result` (to be replaced)
- `src/lib/api/client.ts` — `fetchRunResults()` returns `PaginatedResults<Result>` (update type)
- `src/lib/api/queries.ts` — `useRunResults()` (update; add module/trend/compare hooks)
- `src/lib/api/ws.ts` — SSE event type uses `Result` (update to `TestResult`)
- `src/app/(shell)/runs/[runId]/page.tsx` — main consumer (major update)
- `src/app/(shell)/modules/[moduleId]/page.tsx` — no result consumption yet (add)
- `src/app/(shell)/runs/compare/page.tsx` — run-level only today (add result comparison)
- `src/components/results/renderers/` — empty (create generic + registry)

---

## 4. Generated-types directory + generation scripts

- `src/lib/proto/generated/` — **empty**. No TypeScript proto types generated yet.
- `src/lib/api/generated/` — **does not exist**. No OpenAPI client generated.
- `scripts/` — **empty**. No generation scripts.

**Decision**: The server does not commit an `openapi.json` file — it is generated at runtime by the Drogon framework. The canonical REST contract is the hand-written types updated to match the server's `result_to_json()` serialiser. Generation scripts will be created that:
1. `generate-proto-types.sh` — invoke `ts-proto` against `../../Acadia-HAL/protos/` to produce `src/lib/proto/generated/`.
2. `generate-api-client.sh` — fetch `http://localhost:3000/openapi.json` from a running server and pipe through `openapi-typescript`.

Both scripts are run-once helpers; the dashboard's canonical REST types live in `src/lib/api/types.ts`.

---

## 5. SSE vs polling decision

**SSE** is the live transport (confirmed). The server uses `GET /api/v1/runs/{id}/events` with Server-Sent Events. `ws.ts` already uses `EventSource`. Run detail page will wire SSE to TanStack Query cache updates via a new `useRunSSE(runId)` hook.

---

## 6. Theme-token / status-colour references

- `badge.tsx` — uses Tailwind classes directly: `success` = green-100/800, `warning` = yellow-100/800.
- Run detail page — inline `r.status === "pass" ? "success" : "destructive"` badge variant.
- No centralised status → colour map exists yet.

New `<StatusBadge>` component will be the single source of truth for status colours.

---

## 7. int64 precision

`duration_ns` is int64 nanoseconds. At `Number.MAX_SAFE_INTEGER ≈ 9×10^15`, durations up to ~104 days are representable exactly. For embedded hardware tests this is more than sufficient. A display warning is added for values exceeding `Number.MAX_SAFE_INTEGER` at the `toDisplayString` layer. The `int` `TypedValue` has the same treatment — JavaScript `number` used, with a warning logged (not surfaced as UI error) for very large sensor values.

Decision recorded; deferred to Phase 9 for full edge-case handling.
