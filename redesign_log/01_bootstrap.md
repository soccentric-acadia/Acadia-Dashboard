# Phase 1 — Bootstrap

## Proto Layer Audit

**Verdict: FRESH. Proceed.**

All required types confirmed in `Acadia-HAL/protos/common.proto`:

| Type | Status |
|---|---|
| `TestStatus` | ✓ enum with `TEST_STATUS_PASS/FAIL/ERROR/TIMEOUT/ABORTED/SKIPPED` + deprecated aliases |
| `TestSeverity` | ✓ enum with `TEST_SEVERITY_INFO/WARNING/ERROR/CRITICAL` |
| `TypedValue` | ✓ oneof `bool_value / int_value / double_value / string_value` |
| `TestOutput` | ✓ status, severity, reason map, metrics map, monitoring map, event map, error_message |
| `TestResult` | ✓ module_id, test_id, name, sequence, timestamp, duration, output, subtests |

`hal_service.proto`: gRPC service with RPCs for all four execution modes.
`client_service.proto`: bidirectional streaming client↔server connect.

**Module registry** (`Acadia-HAL/protos/registry/modules.yaml`):
- 50 modules across 15 categories
- All follow pattern: Config { repeated string test_names } / Result { repeated TestResult results }

## Dashboard Inventory

### Existing structure: `webui/`
- **Framework**: Next.js 14, TypeScript, Tailwind CSS 3, shadcn/ui
- **Fonts**: Space Grotesk (sans), JetBrains Mono (mono) — matches spec
- **Root layout**: `src/app/layout.tsx` — ThemeProvider + QueryProvider + Toaster ✓
- **Shell layout**: `src/app/(shell)/layout.tsx` → AppShell → TopBar + BoardStrip + SidebarModules

### Existing primitives (`src/components/primitives/`):
- ✓ `count-up.tsx`
- ✓ `kpi-card.tsx`
- ✓ `live-dot.tsx` — has idle/running/pass/fail/error/timeout/skipped/aborted/never/disconnected states
- ✓ `module-icon.tsx`
- ✓ `pulse-ring.tsx`
- ✓ `section-card.tsx`
- ✓ `sparkline.tsx`
- ✗ `connection-pill.tsx` — **MISSING** (needs creation)
- ✗ `status-badge.tsx` (exists in ui/ as a basic component; needs a canonical `<StatusBadge>` primitive in primitives/)
- ✗ `empty-readout.tsx` — **MISSING** (needs creation)

### Existing shadcn/ui (`src/components/ui/`):
All present: accordion, alert-dialog, alert, avatar, badge, breadcrumb, button, card, carousel, collapsible, command, dialog, drawer, dropdown-menu, hover-card, input-otp, input, label, navigation-menu, popover, progress, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, status-badge, switch, table, tabs, toggle-group, toggle, tooltip

**Missing shadcn components** (need to install):
- `calendar` — for date range pickers
- `chart` — Recharts wrapper
- `checkbox` — for module list
- `form` — react-hook-form integration
- `pagination` — for data tables
- `textarea` — for notes
- `sonner` (toaster) — already via `sonner` package, just needs ui component

### Existing dependencies (package.json):
All major deps already installed: `motion`, `zustand`, `recharts`, `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual`, `cmdk`, `next-themes`, `sonner`, `zod`, `react-hook-form`, `@hookform/resolvers`, `ts-proto`, `embla-carousel-react`, `react-resizable-panels`, `lucide-react`

**Missing dependencies**:
- `idb-keyval` — IndexedDB persistence for sim engine
- `seedrandom` — deterministic RNG for simulation
- `@types/seedrandom` — types

### Existing data/state layer (`src/lib/`):
- `lib/api/client.ts` — REST client with offline fallback to mock data
- `lib/api/queries.ts` — TanStack Query hooks
- `lib/api/types.ts` — TypeScript type definitions
- `lib/api/mock.ts` — mock data
- `lib/api/ws.ts` — WebSocket/SSE client
- `lib/board/context.tsx` — Board context (BoardProvider)
- `lib/status/index.ts` — Status/Severity helpers
- `lib/value/typed.ts` — TypedValue helpers
- `lib/config-store.ts` — Zustand store for config

**Missing** (new architecture):
- `src/proto/` — proto-generated types + module catalog (Phase 2)
- `src/data/` — unified data layer with resolver → live/sim (Phase 4)
- `src/state/connection.ts` — connection state Zustand store (Phase 4)
- `src/state/preferences.ts` — preferences Zustand store (Phase 4)

### Existing pages:
- `(shell)/page.tsx` — dashboard (needs rebuild)
- `(shell)/runs/` — exists (needs rebuild)
- `(shell)/modules/` — exists (needs rebuild)
- `(shell)/logs/` — exists
- `(shell)/templates/` — exists
- `(shell)/schedules/` — exists
- `(shell)/settings/` — exists
- `(shell)/ota/` — exists
- `(shell)/reports/` — exists
- `(shell)/help/` — exists
- `login/page.tsx` — exists (needs "simulated mode" link)
- `(setup)/wizard/` — exists

**Missing pages** (new routes from spec):
- `runs/new/` — needs full radio-group form
- `runs/[runId]/` — needs run detail
- `runs/compare/` — needs run compare

### Tailwind config status:
- ✓ Status palette defined: pass/fail/error/timeout/skipped/aborted/running/never
- ✗ Missing: `simulated` (electric purple) + `disconnected` (hollow muted) tokens

### globals.css status:
- ✓ Full status CSS variables in both light + dark themes
- ✗ Missing: `--status-simulated` and `--status-disconnected` CSS variables

## shadcn Primitive Install Plan

To add: `calendar`, `chart`, `checkbox`, `form`, `pagination`, `textarea`
(All others already installed)

## Follow-up Notes (Out of scope — other repos)

- Server should expose `/api/v1/health`, `/api/v1/board`, `/api/v1/runs`, `/api/v1/results`, `/api/v1/logs`, `/api/v1/templates`, `/api/v1/schedules`, `/api/v1/ota`, `/api/v1/notifications`
- Server should stream results via SSE at `/api/v1/runs/{id}/stream`
- Board vitals (cpu_temp, cpu_load, ram_used, uptime) should be available via SSE or polling endpoint

---
*Phase 1 complete. Protos are fresh, inventory complete, gaps identified. Proceeding to Phase 2.*
