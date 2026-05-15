First reivew thsese repos Acadia-Client  Acadia-HAL  Acadia-OS  Acadia-Server



# Web UI Update — Align with HAL Refactor

You are updating the **Web UI App** (Next.js 14 App Router + shadcn/ui + TanStack Query + TanStack Table + Recharts + ts-proto, talking REST to the Server App) to consume the **refactored HAL result types**. The HAL, the shared protos, the on-target Client App, and the Server App have all been updated upstream. The Web UI must now be updated everywhere it touches result data: type generation, API client, form builder, result rendering, charts, tables, filters, run detail, compare, baseline diff, trend, distribution, heatmap, logs correlation, exports, reports, notifications, and the schema-driven plumbing that drives all of it.

This is a long-running task. Time is not a constraint. **Correctness, completeness, and consistency are the only constraints.**

---

## 1. Background — what changed upstream

The new canonical shape that flows from the Server's REST API into the Web UI:

```ts
type Status   = "PASS" | "FAIL" | "ERROR" | "TIMEOUT" | "SKIPPED" | "ABORTED";
type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

type TypedValue =
  | { type: "bool";   value: boolean }
  | { type: "int";    value: number }    // server emits int64; UI may need bigint-safe handling for large values
  | { type: "double"; value: number }
  | { type: "string"; value: string };

interface TestOutput {
  status: Status;
  severity: Severity;
  reason: Record<string, string>;
  metrics: Record<string, TypedValue>;
  monitoring: Record<string, TypedValue>;
  event: Record<string, TypedValue>;
  error_message: string;
}

interface TestResult {
  id: string;
  run_id: string;
  module_id: string;
  module_version: number;
  test_id: string;
  name: string;
  sequence: number;
  timestamp: string;       // ISO 8601 UTC
  duration_ns: number;     // int64 nanoseconds; UI converts for display
  status: Status;
  severity: Severity;
  error_message: string;
  reason: Record<string, string>;
  metrics: Record<string, TypedValue>;
  monitoring: Record<string, TypedValue>;
  event: Record<string, TypedValue>;
  subtests: TestResult[];
  payload_type_url: string;
  payload_b64: string;
}
```

Old shape that must disappear from the UI: a boolean `passed` field, a flat `data` map / array of strings, single-typed `duration` numbers, any UI logic that treated values as strings by default.

The Server's `/openapi.json` is the authoritative REST contract. The Web UI generates its TypeScript API client from it. **Regenerating the client is step one** — every other change in this update depends on the new generated types being in place.

---

## 2. Scope of this update

You will touch:

1. **Generated types & API client** — regenerate from the updated OpenAPI + protos. Old generated files deleted; build/regen scripts validated.
2. **Type-level glue** — any hand-written types that mirrored the old shape (often in `src/lib/api/types.ts` or similar). Replace with the generated types or thin re-exports.
3. **Result renderers** — the generic schema-driven renderer plus any module overrides registered in the renderer registry. Render `status` and `severity` distinctly. Render the four typed maps as separate sections. Render `error_message` prominently when set. Render subtests recursively.
4. **Run detail page** — per-module summary (PASS / FAIL / NEVER / and now `ABORTED` distinctly), drill-in time-series, live streaming.
5. **Module page** — last result card, configuration panel, history table (with click-to-chart on numerics), trend, distribution, heatmap, baseline diff, threshold editor, raw payload viewer.
6. **Run compare page** — typed value comparisons. Status changes per the wider status set. Numeric drift uses numeric typing, not stringified equality.
7. **Logs page** — log↔result correlation by timestamp still works; result-jump links carry the new result id.
8. **Forms** — the schema-driven form builder is mostly module-config and unaffected by *result* shape changes, but threshold editors and event-condition editors now operate on typed values; update.
9. **Filters and tables** — every result table column, every filter that referenced `passed`, every status badge that assumed two-valued status.
10. **Charts** — Recharts series construction must extract typed numerics (only `int` and `double` `TypedValue` variants are chartable); strings and bools render in alternate UI (table cells, switches).
11. **Exports** — CSV download links go through the server; verify the UI doesn't post-process or stringify exported data.
12. **Reports** — UI-driven PDF/HTML report previews mirror server templates; update the preview renderer.
13. **Notifications UI** — failure notifications now distinguish FAIL / ERROR / TIMEOUT / ABORTED; update display.
14. **Empty / error / loading states** — verify new statuses don't fall into "unknown" empty states.
15. **Theming** — status colors. PASS green, FAIL red, ERROR red (darker), TIMEOUT amber, SKIPPED gray, ABORTED neutral/purple. Severity tint or border.
16. **Tests** — unit (Vitest + RTL) and E2E (Playwright). Coverage of every `Status` value and every `TypedValue` variant.

You will **not** touch:
- The HAL, the protos, the Client App, or the Server App.
- Any module-specific Config schema (those didn't change in this refactor — they live in the per-module protos which are about *test configuration*, not *test results*).

---

## 3. Architectural rules — reaffirmed

The Web UI's load-bearing patterns must survive this refactor.

- **Schema-driven rendering.** A generic renderer handles every module's result by default; custom renderers are *overrides* registered by `module_id`. The new typed maps make the generic renderer richer — they do not justify adding a switch over modules.
- **Renderer registry stays small.** This refactor must not motivate adding many module-specific renderers. If the generic renderer can't display something, fix the generic renderer.
- **No `switch(module_id)`** outside the renderer registry, anywhere.
- **Server is the source of truth.** If a status or severity arrives that doesn't fit the spec, the UI surfaces it visibly (an `UNKNOWN` chip) rather than silently coercing. Forwards-compat for any future enum additions.
- **Persistent board header always visible.** Refactor does not remove or hide it. The status of an active run shown in the header now uses the new status badges.
- **Sidebar modules show live status** per module — refactor preserves and extends this (PASS / FAIL / NEVER / running / etc.).
- **Generated code is build output**, not authoritative source. Never hand-edit generated proto types or API client code.
- **TanStack Query owns server state.** No drifting into local component state for things that should live in the cache.
- **The UI never talks to the board or the database directly** — only REST to the server. Refactor does not change this.

---

## 4. Required code changes — concrete

### 4.1 Regenerate types and API client

1. Run `scripts/generate-proto-types.sh` against the updated `protos/`. Output under `src/lib/proto/generated/` (build artifact, gitignored).
2. Run `scripts/generate-api-client.sh` against the server's `/openapi.json`. Output under `src/lib/api/generated/`.
3. Delete any stale hand-written types in `src/lib/api/types.ts` that duplicate generated ones.
4. Re-export the canonical types (`TestResult`, `TestOutput`, `Status`, `Severity`, `TypedValue`) from a single module (`src/lib/api/types.ts` or `src/lib/proto/types.ts`) and import from there everywhere. Avoid scattered imports from `generated/`.
5. Verify `tsc --noEmit` runs without errors against the new generated types. Expect compile breaks downstream — that's the work in the rest of this prompt.

### 4.2 TypedValue helpers

Create a small set of pure utilities under `src/lib/value/`:

```ts
// src/lib/value/typed.ts
export function isNumeric(v: TypedValue): v is { type: "int" | "double"; value: number };
export function isBool(v: TypedValue):    v is { type: "bool";   value: boolean };
export function isString(v: TypedValue):  v is { type: "string"; value: string };

export function toNumber(v: TypedValue): number | null;   // null for non-numerics
export function toDisplayString(v: TypedValue, opts?: { precision?: number; unit?: string }): string;
export function compare(a: TypedValue, b: TypedValue): -1 | 0 | 1 | null; // null for incompatible types

export function extractNumericSeries(
  results: TestResult[],
  source: "metrics" | "monitoring" | "event",
  key: string,
): { timestamp: string; value: number }[];   // filters non-numerics and missing keys
```

These are the only place the UI inspects the `TypedValue` shape. Chart builders, threshold editors, sort comparators, and table cells call these helpers — they do not unwrap the `{type, value}` object inline.

### 4.3 Status and severity helpers

```ts
// src/lib/status/index.ts
export const STATUS_ORDER: Status[] = ["PASS", "FAIL", "ERROR", "TIMEOUT", "SKIPPED", "ABORTED"];

export function isFailureStatus(s: Status): boolean;    // FAIL | ERROR | TIMEOUT
export function isUserCancelled(s: Status): boolean;    // ABORTED
export function isNoOp(s: Status): boolean;             // SKIPPED
export function isTerminal(s: Status): boolean;         // all except in-flight (no in-flight in this enum, but defend)

export function statusColor(s: Status, severity?: Severity): {
  fg: string; bg: string; ring: string;
};

export function severityRank(s: Severity): number;      // INFO=0, WARNING=1, ERROR=2, CRITICAL=3
```

Color tokens come from the shadcn theme tokens, not hex literals. Suggested mapping (verify against the theme):

| Status   | Token family   |
|----------|----------------|
| PASS     | `success`      |
| FAIL     | `destructive`  |
| ERROR    | `destructive` (darker) |
| TIMEOUT  | `warning` / amber |
| SKIPPED  | `muted`        |
| ABORTED  | `accent` (neutral/purple) |

Severity modulates intensity — `WARNING` softens, `CRITICAL` adds a ring/border.

A `<StatusBadge>` component wraps these helpers; every page uses it. No hand-rolled status pills.

### 4.4 The generic result renderer

Located at `src/components/results/renderers/generic.tsx`. Update to render the new shape end-to-end.

Layout (top to bottom):
1. **Header**: status badge, severity badge (when non-INFO), module name, test name, timestamp, duration (humanized from `duration_ns`), sequence (when streaming).
2. **Error message banner** — visible only when `error_message` is non-empty. Use destructive variant.
3. **Reason** — rendered as a small key-value list (keys typically short labels like `why`, `detail`).
4. **Metrics** — keyed list of `TypedValue`. Numeric values right-aligned with type-aware formatting. Each numeric row has a small "chart" affordance (click → opens that field in the trend chart for this test).
5. **Monitoring** — same shape as Metrics, in a separate collapsible section. Empty section hidden.
6. **Event** — same shape, separate section. Empty section hidden.
7. **Subtests** — recursive list. Each subtest rendered with this same renderer. Nested visually (indent / tree).
8. **Raw payload viewer** — collapsible. Shows decoded JSON of the proto from `payload_b64` + `payload_type_url`, plus the base64 source on demand. Decode using generated proto types; fall back to "raw bytes (type X)" on decode failure.

The renderer must handle every combination: empty maps, all maps populated, deep subtest trees, every status, every severity, every `TypedValue` variant.

### 4.5 Renderer registry

`src/components/results/renderers/registry.ts` exports a `Record<string, ResultRenderer>`. Start empty — the generic renderer covers every module by default. The refactor does not introduce custom renderers; if one is needed for a specific module (e.g. a graphical sensor sweep), it lands in a follow-up.

The registry lookup pattern:

```ts
const renderer = registry[result.module_id] ?? GenericResultRenderer;
return <renderer result={result} />;
```

This is the only `module_id`-aware code path in the UI.

### 4.6 Run detail page

`src/app/runs/[runId]/page.tsx` and its children.

Changes:

- **Per-module summary table**: badge column now uses the new status set. Logic per module:
  - **PASS** — last result for the module has `status === "PASS"`.
  - **FAIL** — last result `status ∈ {FAIL, ERROR, TIMEOUT}`. Show severity as a tint on the badge.
  - **NEVER** — module enabled in this run, no result, or all results SKIPPED.
  - **ABORTED** — last result `status === "ABORTED"`. Distinct badge.
  - If the run itself was cancelled mid-stream, top-of-page banner shows it; per-module ABORTED badges hang off that.
- **Drill-in** to a module within a run: time-series table of all results for `(run_id, module_id, test_id)`. Columns: sequence, timestamp, status badge, severity, key metrics (a few top by selection or convention), duration. Click any row → expanded view using the generic renderer.
- **Click numeric field in expanded view** → adds that field to the chart for this drill-in. Multiple fields chartable simultaneously (different lines). Chart uses `extractNumericSeries` from Section 4.2.
- **Live mode**: if the run is active, results stream in via SSE (or polling fallback — confirm what the server exposes). Each new result appended to the table; chart updates incrementally. Sequence numbers drive the order, not arrival time.
- **Filter within drill-in**: by status, by severity, by time range, free-text search in `reason` and `error_message`.

### 4.7 Module page

`src/app/modules/[moduleId]/page.tsx`.

Changes (the page is module-scoped, not run-scoped):

- **Last result card** at the top uses the generic renderer for the most recent result of any test in this module.
- **History table**: paginated results across all runs for this module. Columns: timestamp, run name, test_id, status, severity, top metrics, link to run detail.
- **Trend view**: select a `(test_id, metric_key)` pair → time-series chart of that numeric across runs. The metric selector lists only numeric keys observed in recent results (server's `/modules/{id}/trend?from=&to=&field=` endpoint already filters to numerics; UI uses the response).
- **Distribution view**: histogram of values for a selected `(test_id, metric_key)`. Numeric only.
- **Heatmap**: status grid of (run × test_id). Color per status. Status legend shows all six statuses.
- **Baseline diff**: when a baseline run is set, show per-test status change since baseline and per-metric drift (numeric only). Use `compare()` from `value/typed.ts`.
- **Threshold editor**: per `(test_id, metric_key)`, set op (`GT|LT|GE|LE|EQ|NE`), set typed value (an input that respects the metric's observed type). On save → POST to server.
- **Raw payload viewer toggle** — global default from Settings, overrideable per result.

### 4.8 Compare page

`src/app/runs/compare/page.tsx` with `?a=...&b=...`.

Changes:

- For each `(module_id, test_id)` pair across both runs, show row with: status A → status B (badge transition), per-metric numeric drift (only numeric `TypedValue`s), and a categorization label:
  - **unchanged** — same status, no metric drift beyond threshold.
  - **improved** — status went from non-PASS to PASS, or numeric metric drifted in a configured-better direction.
  - **regressed** — status went from PASS to non-PASS.
  - **drifted** — numeric metric changed beyond a configurable threshold while status unchanged.
  - **disappeared** — present in A, absent in B.
  - **appeared** — absent in A, present in B.

These categorizations come from the server's `/runs/{a}/compare/{b}` endpoint; the UI renders. Do not duplicate categorization logic in the client.

### 4.9 Result table component

`src/components/results/result-table.tsx` (TanStack Table).

Update default columns:
- **Sequence** (right-aligned numeric)
- **Timestamp** (relative + absolute on hover)
- **Status** (badge using `<StatusBadge>`)
- **Severity** (small chip; hidden by default for INFO)
- **Test** (test_id + name)
- **Duration** (humanized from `duration_ns`)
- **Top metrics** (configurable; up to 3 by default, expandable)

Sorting on metric columns uses `compare()` for typed comparison.

Filtering on `status` is a multi-select chip group of all six values. Filtering on `severity` similarly.

Free-text search hits `name`, `test_id`, `error_message`, and stringified values in `reason`.

### 4.10 Logs page

`src/app/logs/page.tsx`.

The log entry shape itself doesn't change in this refactor — but **log-to-result correlation links must use the new result id** and the timestamp source on the result is the new `timestamp` field. Verify:

- Clicking "jump to logs" from a result detail navigates to logs filtered to that timestamp window with `result_id` as a query param.
- Clicking a log line that's correlated to a result navigates back to the result detail using the new id field.

### 4.11 Notifications UI

`src/components/notifications/*` (in-app toast + notifications page).

Failure notification categories now distinguish:
- **Test failure** — `status ∈ {FAIL, ERROR, TIMEOUT}` with `severity ∈ {ERROR, CRITICAL}`. Destructive variant.
- **Test warning** — `status ∈ {FAIL, ERROR}` with `severity === "WARNING"`. Warning variant.
- **Run aborted** — separate notification, neutral variant.
- **Threshold crossed** — derived from server; carries `metric_key`, threshold spec, observed typed value, deep link.

Each notification carries module name, test name, status, severity, the truncated `error_message`, and a click-through to the result detail.

### 4.12 Exports

The server emits CSV and NDJSON with the documented column / line shape. The UI's export buttons:

- Download CSV via a direct anchor to `/api/v1/runs/{id}/results/export?format=csv`. Do not stream-process in the browser.
- Same for JSON via `?format=json` (NDJSON streaming).
- If the UI ever needs to preview an export client-side, it must use the same DTO shape — no UI-side re-serialization.

Verify export filename conventions and Content-Disposition are honored — don't introduce a UI-side renamer that strips the run id from the filename.

### 4.13 Reports UI

Report preview rendering uses the same generic renderer for each result. A report template selector chooses sections (run header, per-module summary, drill-ins, charts, log slices); each section uses the corresponding existing component.

Confirm: a report generated by the server's `/reports/runs/{id}` endpoint and a UI-rendered preview of the same run produce visually consistent output for status/severity badges, typed values, and subtests. Cosmetic differences (PDF page breaks) are expected; data divergence is not.

### 4.14 Empty / loading / error states

For every page touching results, audit empty states:
- **No results yet** — clear message, not "an error occurred."
- **All results SKIPPED** — show the run as such; don't display blank rows.
- **Run in `ABORTED` state with partial data** — banner explains; partial data displayed.
- **Unknown status from server** (forwards-compat) — render as `UNKNOWN` chip with a tooltip ("Server returned a status this UI version doesn't recognize"). Don't crash, don't coerce.

### 4.15 Theming and tokens

Add or update theme tokens in `tailwind.config.ts` / shadcn theme:
- `success` (PASS), `destructive` (FAIL/ERROR), `warning` (TIMEOUT), `muted` (SKIPPED), `accent` (ABORTED).
- Severity overlay: subtle ring color for CRITICAL, lighter for WARNING.

Verify dark mode and light mode both pass contrast on every status × severity combination.

### 4.16 SSE / streaming hooks

If live results use SSE, the message payload now carries the new shape. Update the SSE message parser to use the generated `TestResult` type. Verify TanStack Query cache updates on each message append to the correct query key.

If the server moved from polling to SSE (or vice versa) as part of its update, conform. Confirm at Phase 1.

---

## 5. Tests — required coverage

### 5.1 Unit tests (Vitest + RTL)

- `value/typed.ts` — every helper, every `TypedValue` variant, `extractNumericSeries` with mixed-typed inputs (numeric kept, non-numeric filtered).
- `status/index.ts` — every helper, every `Status` and `Severity` combination, color token correctness.
- `<StatusBadge>` — renders every status, severity overlays apply, `UNKNOWN` fallback works.
- `<GenericResultRenderer>` — fixture results covering: PASS with metrics only; FAIL with reason + metrics + monitoring; ERROR with `error_message`; TIMEOUT; SKIPPED; ABORTED; one with subtests two levels deep; one with empty maps.
- `<ResultTable>` — sorting on numeric metric column uses typed compare; filter chips for status work; severity column hides for INFO.
- Renderer registry — empty registry falls through to generic; injecting a custom renderer routes correctly.

### 5.2 Page-level tests (RTL or Playwright component tests)

- Run detail per-module summary: badge logic across every status and the NEVER case.
- Module page trend chart: numeric series extracted, non-numerics ignored, empty series shows empty-state.
- Compare page: each category (unchanged / improved / regressed / drifted / disappeared / appeared) renders correctly given fixture data.
- Threshold editor: typed value input matches observed metric type; invalid type combos show validation error.
- Notification rendering: severity styling differs visibly between WARNING and CRITICAL.

### 5.3 E2E tests (Playwright)

Against a mocked server (msw or Playwright request mocking) emitting the new shape:

- Launch a run → live SSE updates → status badge transitions correctly → run completes → drill-in chart populated.
- Open module page → select metric → trend renders → set threshold → notification fires when next fixture result crosses.
- Mark a run as baseline → open compare → drift highlighted.
- ABORTED run end-to-end: cancel mid-stream, final state shows ABORTED, partial results visible.
- Forwards-compat: server returns `status: "FUTURE_STATUS"` → UI renders `UNKNOWN`, page does not crash.
- Logs ↔ result jump: click result → logs filter to timestamp → click log line → return to result.

### 5.4 Grep verification

```
grep -rn "\.passed\b"        webui/src/
grep -rn "output\.data\b"    webui/src/
grep -rn "duration<double>"  webui/src/   # belt-and-suspenders; mostly irrelevant in TS
grep -rn "result\.data\b"    webui/src/
```

Expect zero hits in active code. Generated files (`src/lib/proto/generated/`, `src/lib/api/generated/`) are excluded.

### 5.5 Type-level check

`tsc --noEmit` runs clean against the entire `src/`. No `any`, no `@ts-ignore` introduced as part of this refactor (existing ones stay if scoped, but new ones are not allowed to bypass the type changes).

---

## 6. Workflow — phases

Long-running task. No human gates. Write each phase report under `webui_update/`.

### Phase 1 — Discovery
1. Confirm the upstream updates are in place:
   - Read `protos/common.proto` — `TestStatus`, `TestSeverity`, `TypedValue`, `TestOutput`, `TestResult` must be defined as in Section 1.
   - Fetch the server's `/openapi.json` (or read it from the server source) — the result DTO must match Section 1.
   - If either is stale, **stop and report**.
2. List every Web UI file that references the old result shape: `passed`, flat `data`, untyped `duration`. Output the file list.
3. List every component, hook, page, and util that consumes result data.
4. List the generated-types directory and the API client generation script paths. Confirm both are runnable.
5. Confirm decision: SSE vs polling for live runs (whatever the server actually supports today).
6. List every theme token / color reference touching status colors.

Write `webui_update/01_discovery.md`.

### Phase 2 — Plan
For each file from Phase 1, a concrete edit plan in dependency order:
1. Regenerate types and API client.
2. Add typed-value helpers and status helpers.
3. Update `<StatusBadge>` and rendering primitives.
4. Update the generic result renderer.
5. Update the result table, filters, charts.
6. Update run detail / module / compare pages.
7. Update notifications, logs correlation, exports, reports.
8. Update tests.

Write `webui_update/02_plan.md`.

### Phase 3 — Regenerate and stabilize types
1. Run both generation scripts.
2. Re-export canonical types from a single module.
3. Run `tsc --noEmit`. Expect many errors downstream — that's the work; do not silence them with `any` or `@ts-ignore`. Catalog them in the phase report; they're the next phase's input.

Write `webui_update/03_types_regenerated.md`.

### Phase 4 — Helpers and primitives
1. Implement `value/typed.ts` and `status/index.ts` per Sections 4.2, 4.3.
2. Implement / update `<StatusBadge>` per Section 4.3.
3. Unit tests for each.
4. Run tests until green.

Write `webui_update/04_helpers.md`.

### Phase 5 — Generic result renderer
1. Update `GenericResultRenderer` per Section 4.4.
2. Verify renderer registry pattern in `registry.ts` per Section 4.5 — empty registry, generic fallback, single lookup point.
3. Render tests across the full status × severity × map-population matrix.
4. Subtests recursion test.

Write `webui_update/05_renderer.md`.

### Phase 6 — Tables, filters, charts
1. Update `<ResultTable>` per Section 4.9.
2. Update chart-extraction code paths to use `extractNumericSeries`.
3. Verify TanStack Query keys and cache invalidation still match server query shapes (don't change keys casually — they break cached data across reloads, but they may need to if the API shape changed). Document.
4. Tests: sorting, filtering, chart series.

Write `webui_update/06_tables_charts.md`.

### Phase 7 — Pages
1. Update Run detail (per-module summary + drill-in + live).
2. Update Module page (history + trend + distribution + heatmap + baseline diff + threshold editor).
3. Update Compare page.
4. Update Logs correlation.
5. Update Notifications UI.
6. Update Exports + Reports UI.

Page-level tests after each.

Write `webui_update/07_pages.md`.

### Phase 8 — Theming and accessibility
1. Add/update theme tokens per Section 4.15.
2. Verify dark mode and light mode contrast for every status × severity.
3. Keyboard nav and screen-reader labels on `<StatusBadge>`, threshold editor, and any new interactive bits.

Write `webui_update/08_theming.md`.

### Phase 9 — Forwards-compat and edge cases
1. Verify unknown server-emitted status renders as `UNKNOWN` and does not crash.
2. Verify oversized int64 from the server doesn't lose precision in JS — if `duration_ns` or any int metric can exceed `Number.MAX_SAFE_INTEGER`, decide and document handling (e.g., string fallback, bigint, display warning).
3. Verify empty / all-skipped / aborted-with-partial states.

Write `webui_update/09_edges.md`.

### Phase 10 — End-to-end verification
1. `next build` clean.
2. `tsc --noEmit` clean.
3. All unit tests green.
4. All Playwright E2E green against a mocked server.
5. Grep verification per Section 5.4. Zero hits.
6. Manual run against the real updated Server App: launch a run, watch live results, drill in, chart a metric, set a threshold, mark baseline, compare, abort a run, view notifications, export CSV, generate a report. Capture evidence (screenshots, network captures) under `webui_update/evidence/`.

Write `webui_update/10_verification.md`.

### Phase 11 — Final report
Summarize: regenerated types, helpers added, renderer changes, every page touched, theme tokens, tests added, grep result, ambiguities resolved, any deferred work (e.g., bigint precision for large int metrics if explicitly deferred).

Write `webui_update/11_final_report.md`.

---

## 7. Hard rules

- **Generated types and the server's OpenAPI are the contract.** If a hand-written type contradicts them, the hand-written type is the bug.
- **One canonical export point for `TestResult` / related types.** No scattered imports from `generated/` across the app.
- **`TypedValue` is never unwrapped inline.** Always through helpers in `value/typed.ts`.
- **`Status` and `Severity` are never compared as strings inline** — always through helpers in `status/index.ts` or `<StatusBadge>`.
- **No `switch(module_id)`** outside the renderer registry. The refactor must not introduce module-specific UI logic.
- **No silent coercion.** Unknown statuses render as `UNKNOWN`. Numeric strings stay strings. Type mismatches surface as validation errors.
- **No `any`, no `@ts-ignore`** introduced to make the refactor compile. Strict mode preserved.
- **localStorage / sessionStorage prohibition stays in place** for artifacts; if this codebase isn't artifact-based, normal storage rules apply but verify the project's existing convention.
- **No new heavyweight dependencies.** Recharts, TanStack Query, TanStack Table, ts-proto, shadcn — that's the stack.
- **Persistent board header remains visible** on every page except login.
- **Renderer registry stays empty** unless a module genuinely cannot be rendered generically. The refactor is not the time to introduce custom renderers.
- **Generated code is build output** — never committed as authoritative.
- **The server is the source of truth** for compare categorization, threshold evaluation, anomaly detection, baseline diff. UI renders; UI does not duplicate logic.
- **Export downloads are direct server links.** No in-browser re-serialization.

---

## 8. Deliverables

At completion of Phase 11:
- Web UI builds clean (`next build` and `tsc --noEmit`).
- All unit tests green; all Playwright E2E green against mocked server.
- Generated types and API client up to date with the new OpenAPI.
- Single canonical re-export of `TestResult`, `Status`, `Severity`, `TypedValue`.
- `<StatusBadge>` used everywhere status is shown — no hand-rolled pills.
- Generic renderer handles every status × severity × map-population case, plus recursive subtests, plus raw payload viewer.
- Renderer registry remains empty (or with a documented narrow override list).
- Module page features functional: trend, distribution, heatmap, baseline diff, threshold editor.
- Run detail features functional: per-module summary with new status set, live streaming, drill-in chart.
- Compare page renders every server-emitted category.
- Notifications differentiate severity visibly.
- Export buttons download server-emitted CSV/JSON without intermediate processing.
- Forwards-compat `UNKNOWN` status path verified.
- Grep verification clean.
- All phase reports under `webui_update/01_…` through `webui_update/11_final_report.md`.
- Evidence directory with screenshots / network captures from the live verification run.

Begin with Phase 1.