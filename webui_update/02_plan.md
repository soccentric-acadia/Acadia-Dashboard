# Phase 2 — Plan

Dependencies: Phase 1 complete. Upstream confirmed stable.

## Edit order (dependency-first)

### Step 1 — Canonical types (`src/lib/api/types.ts`)
- Add `Status`, `Severity`, `TypedValue` union
- Add `TestResult` (with `TestOutput` inlined — server sends flat structure)
- Keep `Result = TestResult` alias during transition
- Update `RunSSEEvent` to use `TestResult`
- Update `PaginatedResults<TestResult>`

### Step 2 — Utils (`src/lib/utils.ts`)
- Add `formatDurationNs(ns: number): string`

### Step 3 — TypedValue helpers (`src/lib/value/typed.ts`, NEW)
- `isNumeric`, `isBool`, `isString` type guards
- `toNumber`, `toDisplayString`, `compare`
- `extractNumericSeries`

### Step 4 — Status helpers (`src/lib/status/index.ts`, NEW)
- `STATUS_ORDER`, `isFailureStatus`, `isUserCancelled`, `isNoOp`, `isTerminal`
- `statusColor`, `severityRank`

### Step 5 — Badge variants (`src/components/ui/badge.tsx`)
- Add `timeout`, `skipped`, `aborted`, `unknown` variants

### Step 6 — StatusBadge (`src/components/ui/status-badge.tsx`, NEW)
- `<StatusBadge status severity? className?>` — single source of truth for all test-result status display
- UNKNOWN fallback

### Step 7 — SSE types (`src/lib/api/ws.ts`)
- Update `RunSSEEvent` to use `TestResult`

### Step 8 — API client additions (`src/lib/api/client.ts`)
- `fetchModuleResults(moduleId, params)` — GET `/api/v1/modules/{id}/results`
- `fetchModuleTrend(moduleId, testId, metricKey, from?, to?)` — GET `/api/v1/modules/{id}/trend`
- `fetchRunCompare(runAId, runBId)` — GET `/api/v1/runs/{a}/compare/{b}`
- `fetchRunResultsByModule(runId, moduleId, testId?, params?)` — drill-in results
- Update `fetchRunResults` return type to `PaginatedResults` with `TestResult`

### Step 9 — Query hooks (`src/lib/api/queries.ts`)
- Add `useModuleResults`, `useModuleTrend`, `useRunCompare`
- Add `useRunSSE(runId)` — wires SSE events to TanStack Query cache
- Update `useRunResults` return type

### Step 10 — Generic result renderer (`src/components/results/renderers/generic.tsx`, NEW)
Layout: header → error banner → reason → metrics → monitoring → event → subtests → raw payload

### Step 11 — Renderer registry (`src/components/results/renderers/registry.ts`, NEW)
Empty record; generic fallback lookup

### Step 12 — Result table (`src/components/results/result-table.tsx`, NEW)
TanStack Table with: sequence, timestamp, status badge, severity, test name, duration, top metrics
Sorting via `compare()`, multi-select status/severity filters, free-text search

### Step 13 — Run detail page (`src/app/(shell)/runs/[runId]/page.tsx`)
- Per-module summary table (PASS/FAIL/NEVER/ABORTED derivation)
- Drill-in: time-series of (module_id, test_id) pairs with status badges
- Expanded result view → GenericResultRenderer
- Chart affordance for numeric metrics (click field → Recharts line)
- SSE live updates via `useRunSSE`
- Filter: status multi-select, severity, free text
- ABORTED run banner

### Step 14 — Module page (`src/app/(shell)/modules/[moduleId]/page.tsx`)
- Last result card (GenericResultRenderer)
- History table (ResultTable, paginated)
- Trend view (Recharts line chart, `extractNumericSeries`)
- Distribution view (histogram placeholder)
- Heatmap: run × test_id status grid
- Baseline diff section
- Threshold editor (uses existing `createAlertRule`)

### Step 15 — Compare page (`src/app/(shell)/runs/compare/page.tsx`)
- Call `fetchRunCompare` instead of field-diff approach
- Render categorised diffs: unchanged/improved/regressed/drifted/disappeared/appeared
- Numeric drift via `toDisplayString` + `compare()`
- Status transitions via `<StatusBadge>`

### Step 16 — Logs page (`src/app/(shell)/logs/page.tsx`)
- Update result-jump links to use `result.id` (field was already named `id`)
- Pass `result_id` as query param to `/logs?result_id=...`
- Minor: no breaking type changes needed

### Step 17 — Notifications (`src/app/(shell)/settings/page.tsx` alert rules section)
- Alert rules already scoped by module; extend with typed threshold value input
- Notification kind mapping in `Notification.payload`

### Step 18 — Theming (`tailwind.config.ts`, `globals.css`)
- Add CSS variable tokens for `--success`, `--warning`, `--timeout`, `--skipped`, `--aborted`
- Verify dark/light contrast

### Step 19 — Generation scripts (`scripts/`)
- `generate-proto-types.sh`
- `generate-api-client.sh`

### Step 20 — Vitest config + unit tests
- `vitest.config.ts`
- `tests/unit/value-typed.test.ts`
- `tests/unit/status.test.ts`
- `tests/unit/status-badge.test.tsx`
- `tests/unit/generic-renderer.test.tsx`
- `tests/unit/result-table.test.tsx`

### Step 21 — E2E tests (`tests/e2e/`)
- `tests/e2e/run-live.spec.ts`
- `tests/e2e/module-page.spec.ts`
- `tests/e2e/compare.spec.ts`
- `tests/e2e/compat.spec.ts`

## Files NOT touched
- `src/lib/proto/registry.ts` — module registry unchanged
- `src/app/(shell)/configs/**` — config schemas unchanged
- `src/components/configs/**` — config builder unchanged
- `src/app/(shell)/schedules/**` — unchanged
- `src/app/(shell)/templates/**` — unchanged
- `src/app/(shell)/ota/**` — unchanged
- HAL, Client, Server repos
