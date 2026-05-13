# Web UI App Generation Prompt

You are building the **Web UI App** for an Independent Validation & Verification (IV&V) tool suite. This is one of five components in the system. Read this entire document before writing any code. Stop at the checkpoints. Do not improvise architectural decisions that are already made below.

---

## 1. System context

The full suite has five components. You are only building #5.

1. **Yocto OS** — runs on Raspberry Pi targets, supports OTA (swupdate). Already done.
2. **HAL** — C++ library on the target. 50+ modules (CPU, memory, peripherals, sensors, etc.). Four execution modes. Already done.
3. **Client App** — C++ app on the target. gRPC to the Server App.
4. **Server App** — Python app on x86 server. gRPC for clients, REST + OpenAPI for this Web UI. Postgres-backed.
5. **Web UI App** — *what you are building*. Operator-facing dashboard. Talks REST to the Server App.

**The system is purpose-built for a single board at a time.** There is no fleet, no multi-tenant, no board picker in the runtime UI. Adding/removing the board happens in Settings.

The Web UI is the only user-facing surface in the entire system.

---

## 2. UX north star — read this twice

> **"When the user logs in, they should feel like the board is in their hands."**

Everything about the board must be **visible, explicit, and configurable at a glance**. No hidden state. No buried settings. Color-coded status everywhere. The sidebar is the board's physical-feeling hardware inventory. A persistent header keeps the board's identity and live state in view at all times.

Every architectural and design choice below serves this principle. When in doubt, choose the option that makes the board feel more present and tangible.

---

## 3. Global layout

### Persistent board header (always visible, top of every page)
- Board name + model
- Online/offline indicator (live)
- OS / HAL / Client versions
- Uptime
- Current activity ("Idle" / "Running: <run name>" with progress)
- Click anywhere on the header → board detail in Settings

### Sidebar — hardware modules (left, collapsible groups)
- The literal HAL module inventory of *this* board, fetched from the server
- Grouped by category (CPU, Memory, Storage, Sensors, Peripherals, …)
- Each module row shows:
  - Module name
  - Live status indicator: idle / running / **PASS** / **FAIL** / **NEVER**
  - Last-result timestamp (subtle)
- Click → module page (Section 6)
- Sidebar is the primary navigation for "the board itself"

### Top nav bar (right of sidebar, above content)
- Dashboard
- Runs
- New Run
- Templates
- Schedules
- Logs
- Reports
- OTA
- Settings
- Help
- User menu (far right): profile, change password, API tokens, audit log, logout

### Empty state — no board configured
- If no board is registered, every page redirects to Settings → Add Board with a friendly explainer.

---

## 4. Authentication

- Local account, single user (for now — design schema/UI so adding users later isn't a rewrite, but ship single-user).
- Login screen, change password, logout.
- API tokens page (generate, revoke) for headless/CI use.
- Audit log of significant actions (login, run start/stop, OTA, settings changes).

---

## 5. The central technical challenge — schema-driven everything

The Server App exposes 50+ HAL modules, **each with its own protobuf-defined Config and Result message**. Modules can be added/deprecated server-side.

**You cannot hand-write a form or result renderer per module.** That doesn't scale and breaks every time a module changes.

Required pattern:

- At build/runtime, generate TypeScript types from the existing `protos/` directory.
- The server's `/api/v1/modules` endpoint returns the module registry (id, proto type URLs, version, category, status).
- A **generic schema-driven form builder** renders Config forms from module schema.
- A **generic result renderer** renders Results from module schema.
- A **renderer registry** (`module_id → custom component`) allows overrides where the generic view is insufficient. Start empty.
- `ResultEnvelope.payload` is `google.protobuf.Any`. Confirm at Checkpoint A whether the server returns it as base64 + type_url (client decodes) or pre-decoded JSON (UI just renders).

If you find yourself writing a switch over `module_id` outside the renderer registry, stop and ask.

---

## 6. Pages — full specification

### 6.1 Login (`/login`)
- Username + password
- Error states
- Redirect to Dashboard on success
- If no board configured → redirect to Settings → Add Board after login

### 6.2 Dashboard (`/`)
- System health widget: board online, server reachable, last successful run
- Quick stats: total runs, pass rate %, failure trend (sparkline)
- Recent failures feed (last N failed runs, click to drill in)
- **Last N runs table** (newest first): name, mode, started, duration, status, pass/fail counts. Click row → run detail.
- Pinned/favorite runs section
- Big primary CTA: "Start New Run"

### 6.3 Module pages (`/modules/[moduleId]`)
The most important page in the app. Reached via sidebar click.

Layout (top to bottom):
- Module header: name, category, version, live status badge (idle/running/PASS/FAIL/NEVER), last-tested timestamp
- **Last result card**: status, key fields decoded from payload, "view raw proto" toggle
- **Configuration panel** — inline editable:
  - Enable/disable toggle (for the next run)
  - Mode-aware fields (frequency, monitoring extras, event condition) — only the fields relevant to the currently selected run mode
  - Per-module notes/comments
- **History**:
  - Time-series table of all past results for this module (paginated, server-side)
  - Click a row → expand to show all fields
  - Click any numeric field header → plot that field over time as a chart (Recharts)
  - Filter by time range, status, run
- **Trend view**: same module across many runs over time
- **Baseline diff**: if a golden run is set, diff each result against baseline; show drift indicators
- **Threshold alerts**: configure warn/fail thresholds per numeric field
- **Histogram/distribution** per numeric field
- **Anomaly highlights**: auto-flag outliers (z-score or IQR — pick at implementation)
- **Heatmap**: result status over time (rows = runs, cells = pass/fail/never)
- **Raw proto payload viewer**: collapsible JSON tree of the decoded Any payload
- **Logs slice**: logs filtered to this module's relevant time windows

### 6.4 Runs (`/runs`)
- Paginated list of all runs (server-side pagination)
- Columns: name, UUID (short), mode, started, duration, status, pass/fail counts, tags
- Filters: status, mode, tag, date range, free-text search on name/description/notes
- Bulk actions: delete, export, tag
- Click row → run detail

### 6.5 Run detail (`/runs/[runId]`)
- Run header: name, UUID, mode, status, started, duration, description, tags, notes
- Live mode (if running): progress bar overall + per-module live status, cancel/pause/resume buttons (pause/resume only if mode supports it)
- **Per-module summary table**: every module that was enabled in this run, with its last result before run ended (PASS/FAIL/NEVER badge), result count, click → drill into that module's time-series for *this run*
- **Module time-series detail (drill-in)**:
  - Full time-series table for that module within this run
  - Click numeric field → chart
  - Filter/search within
- **Run-level actions**:
  - Re-run with same config
  - Clone as new run (opens New Run prefilled)
  - Export CSV / JSON
  - Generate PDF/HTML report
  - Add/edit notes after completion
  - Tag (regression, smoke, RC, custom)
  - Attach files (test plan PDF, photos)
  - Compare with another run (opens compare view)
  - Mark as baseline / golden
  - Delete
- **Logs panel**: logs from this run's time window, live-tailing if run is active, with correlation (click a result → jump to that timestamp in logs)

### 6.6 Run compare (`/runs/compare?a=...&b=...`)
- Side-by-side view of two runs
- Per-module diff: did pass/fail status change, value drift on numeric fields, new failures, recovered failures
- Highlight regressions vs. improvements

### 6.7 New Run (`/runs/new`)
The most complex authoring flow. Stepper or single-page form — decide at Checkpoint A based on shadcn patterns.

1. **Basics**: run name (free text, not unique), description, tags
2. **Mode**: pick one of four (single-shot, long-running, monitoring, event-based) as radio cards with descriptions. **No mixing.**
3. **Module selection & config**:
   - All modules disabled by default
   - Search/filter modules
   - Bulk enable/disable: all, by category
   - Per module, when enabled, show mode-appropriate config inline (schema-driven form builder):
     - Single-shot: just module-specific params
     - Long-running: frequency + module-specific params
     - Monitoring: frequency + monitoring extras + module-specific params
     - Event-based: trigger condition + module-specific params
   - Per-module notes
4. **Review**: summary of enabled modules and their configs
5. **Actions**:
   - **Dry-run / Validate**: send config to server for validation without execution
   - **Save as template** (name, description) for reuse
   - **Schedule for later** (one-time datetime or cron-like recurring)
   - **Start now** → redirects to live run detail

Also: **"Clone existing run"** button at top — picks any past run/template as the starting point.

### 6.8 Templates (`/templates`)
- List of saved templates
- Create new template (same builder as New Run, just doesn't execute)
- Edit, delete, duplicate
- Export template to file (JSON)
- Import template from file
- "Use this template" → opens New Run prefilled

### 6.9 Schedules (`/schedules`)
- List of scheduled runs (one-time and recurring)
- Status: pending, last run, next run, enabled/disabled
- Edit cron expression / datetime
- Pause/resume schedule
- View history of executions per schedule

### 6.10 Logs (`/logs`)
- Filters: source (kernel / syslog / app), severity, time range, free-text search
- Virtualized scrolling table
- Live tail toggle (SSE if server supports, polling fallback — confirm Checkpoint A)
- Bookmarks: mark interesting log lines, jump back later
- Saved filter views
- Correlation: link in/out with run detail (jump from result → log moment)
- Export / download

### 6.11 Reports (`/reports`)
- Generate one-off PDF/HTML report for a specific run
- Manage scheduled email reports (which run pattern, when, recipients)
- Custom report templates (header, footer, sections to include)

### 6.12 OTA (`/ota`)
- Current versions: OS, HAL, Client (read-only from board)
- Upload swupdate artifact (file picker)
- Verify signature / checksum (server-side; show result)
- Show diff: current version → target version (versions, changelog if available)
- Trigger upgrade button (confirmation modal)
- Live progress / status of upgrade
- Post-upgrade smoke test: pick a saved template to auto-run after successful upgrade
- Upgrade history table (date, from→to, status, who, rollback button per entry)
- Rollback action per historical upgrade

### 6.13 Settings (`/settings`)
Tabbed:

**Board tab**
- If no board: "Add Board" form (board identifier, network address, pairing token or similar — confirm at Checkpoint A what the server requires)
- If board exists: name (rename), tags, hardware model (read-only), online/offline indicator, **Remove Board** action with strong confirm

**Versions tab**
- OS, HAL, Client, Server, Web UI — each with version + build date if available

**Account tab**
- Change password
- API tokens (list, generate, revoke)

**Notifications tab**
- Run complete: enabled / disabled, channels (in-app, email)
- Test failure: enabled / disabled, channels
- Scheduled reports management link

**Data tab**
- Retention policy (days to keep runs / results / logs)
- Backup database (download)
- Restore database (upload)

**Display tab**
- Theme: light / dark / system
- Time zone
- Date/time format
- Keyboard shortcuts (view + customize)

**Network tab**
- Server connection settings (read-only display of current; if misconfigured, allow edit)
- gRPC connection diagnostic (server ↔ board) — run test button

**Advanced tab**
- HAL module self-test trigger
- Audit log viewer (paginated, filterable)
- Raw proto payload viewer toggle (global default)

### 6.14 Help (`/help`)
- First-run wizard re-launch (add board → smoke test walkthrough)
- In-app docs / tooltips index
- Per-module documentation links
- "What's new" changelog viewer
- Keyboard shortcuts reference

### 6.15 First-run wizard
- Triggered automatically after first login when no board exists
- Step 1: welcome / overview
- Step 2: add board
- Step 3: confirm board online + module inventory loaded
- Step 4: run a smoke test (single-shot, all modules)
- Step 5: tour of the UI

---

## 7. Architectural decisions already made — do not relitigate

- **Framework**: Next.js 14+ App Router. TypeScript strict.
- **UI library**: shadcn/ui + Tailwind + lucide-react.
- **State**: TanStack Query for server state. Zustand only if needed for cross-component client state. No Redux.
- **Forms**: react-hook-form + zod. Schema-driven form builder generates zod schemas dynamically from module metadata.
- **Tables**: TanStack Table. Server-side pagination/sort/filter for result and log tables.
- **Charts**: Recharts. Custom renderers for modules needing more.
- **Streaming**: Server-Sent Events (SSE) preferred for live runs and log tailing; polling fallback. Decide at Checkpoint A.
- **Proto types**: generate TS types from `protos/` using `ts-proto` or `protobuf-ts`. Pick one at Checkpoint A.
- **API client**: generated from server's OpenAPI spec via `openapi-typescript` + `openapi-fetch`. Do not hand-write.
- **Notifications**: in-app via `sonner` (shadcn toast). Email goes through server.
- **Theming**: `next-themes`, default system, theme tokens via shadcn.
- **File uploads** (OTA artifacts, attachments, template import, DB restore): multipart with progress.
- **No global CSS beyond Tailwind base + shadcn theme tokens.**

---

## 8. Required project layout

```
webui/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  components.json
  .env.example
  README.md
  src/
    app/
      layout.tsx                    # root: theme, query client, auth, board context
      page.tsx                      # dashboard
      login/page.tsx
      modules/[moduleId]/page.tsx
      runs/page.tsx
      runs/new/page.tsx
      runs/[runId]/page.tsx
      runs/compare/page.tsx
      templates/page.tsx
      schedules/page.tsx
      logs/page.tsx
      reports/page.tsx
      ota/page.tsx
      settings/page.tsx
      help/page.tsx
    components/
      layout/
        app-shell.tsx
        board-header.tsx            # persistent header
        sidebar-modules.tsx         # hardware-module sidebar
        top-nav.tsx
        user-menu.tsx
      modules/
        module-status-badge.tsx
        config-panel.tsx
        history-table.tsx
        trend-view.tsx
        heatmap.tsx
        threshold-editor.tsx
      runs/
        run-status-badge.tsx
        run-launcher.tsx
        run-progress.tsx
        per-module-summary.tsx
        run-actions.tsx
        compare-view.tsx
      results/
        result-stream.tsx
        result-table.tsx
        result-detail.tsx
        payload-viewer.tsx
        renderers/
          generic.tsx
          registry.ts
      logs/
        log-viewer.tsx
        log-tail.tsx
        log-bookmarks.tsx
      form-builder/
        index.tsx
        field-renderers/
        zod-from-schema.ts
      mode-fields/
        single-shot.tsx
        long-term.tsx
        monitoring.tsx
        event-based.tsx
      ota/
        upgrade-flow.tsx
        upgrade-history.tsx
      settings/
        board-tab.tsx
        versions-tab.tsx
        account-tab.tsx
        notifications-tab.tsx
        data-tab.tsx
        display-tab.tsx
        network-tab.tsx
        advanced-tab.tsx
      onboarding/
        first-run-wizard.tsx
      ui/                           # shadcn primitives
    lib/
      api/
        client.ts                   # generated openapi client wrapper
        queries.ts                  # TanStack Query hooks per resource
        sse.ts
      proto/
        generated/                  # ts-proto output, gitignored
        decode.ts
        registry.ts
      schema/
        module-schema.ts
        proto-to-schema.ts
      auth/
        session.ts
      board/
        context.tsx                 # board state provider
      utils/
    hooks/
    styles/
      globals.css
  public/
  scripts/
    generate-proto-types.sh
    generate-api-client.sh
  tests/
    unit/
    e2e/
```

---

## 9. Operational requirements

- **Loading states**: skeletons on every async view. No blank screens.
- **Empty states**: every list has a designed empty state with next-action.
- **Error states**: every failed query shows recoverable error with retry. Network vs. server errors distinguished.
- **Optimistic updates**: low-risk only (rename, tag, note). Never for run launch or OTA.
- **Pagination**: server-side, cursor-based if available, offset otherwise. Default 50.
- **Accessibility**: keyboard-navigable end-to-end. Focus rings respected. shadcn defaults preserved.
- **Responsive**: laptop primary, tablet secondary. Phone not a target.
- **Performance**: result and log tables virtualized. 10k rows must not jank.
- **Configuration**: `NEXT_PUBLIC_API_BASE_URL` and other env vars. `.env.example` shipped.
- **Theme**: dark/light/system via `next-themes`.

---

## 10. Testing requirements

- **Unit tests** (Vitest + React Testing Library): form builder, schema-to-zod, payload decoder, every non-trivial component.
- **E2E tests** (Playwright): login → first-run wizard → add board → smoke run; create config → launch run → see streaming results; OTA upload → upgrade (mocked); logs filter + tail; run compare; baseline diff.
- Coverage target: 70%+ on `src/` excluding generated code.

---

## 11. Workflow — execute in this order, stop at each checkpoint

### Checkpoint A — Scan and plan
Before writing code:
1. Locate the Server App. Read its OpenAPI spec (`/openapi.json` or FastAPI source). List every endpoint, request/response shape.
2. Locate `protos/`. List every `.proto` file. Read `common.proto`, `hal_service.proto`, `modules/*.proto`, `registry/modules.yaml`.
3. Decide ts-proto vs protobuf-ts. Justify.
4. Confirm: does the server pre-decode `Any` payloads to JSON, or return base64 + type_url?
5. Confirm: SSE or polling for live updates?
6. Confirm: what does board pairing look like (form fields, auth)?
7. Confirm: does the server support pause/resume, or only stop/cancel? Mode-specific?
8. Confirm: notification delivery — server-side email/webhook, or UI-only toasts?
9. Confirm: scheduling — server-side cron, or UI-managed?
10. Confirm: OTA — does the server handle artifact verification and rollback, or does the UI orchestrate?
11. Produce a written plan: page-by-page, what's a Server Component vs Client Component, what queries each page uses, what mutations.
12. List every ambiguity.

**STOP. Wait for confirmation.**

### Checkpoint B — Foundation
1. Next.js + TS + Tailwind + shadcn baseline.
2. Theme provider, query provider, auth provider, board provider.
3. App shell: persistent board header, module sidebar (with mocked data initially), top nav, user menu.
4. Login page, session handling, route protection.
5. `scripts/generate-proto-types.sh` and `scripts/generate-api-client.sh` working.
6. Dashboard skeleton with real health check + real run list.
7. Empty-state "no board configured" routing.

Run lint, typecheck, unit tests. **STOP.**

### Checkpoint C — Modules and the form builder
1. Module sidebar wired to real `/api/v1/modules`.
2. Module page with live status, last result, history table, click-to-chart.
3. Schema-driven form builder with unit tests for every field-type mapping.
4. Renderer registry pattern in place (empty registry, generic renderer as fallback).
5. Payload decoder for `Any` types.

Run tests. **STOP.**

### Checkpoint D — Runs, New Run, Templates, Schedules
1. Runs list + filters.
2. New Run flow with mode picker, module enable/configure, dry-run, save-as-template, schedule, start.
3. Run detail with per-module summary, drill-in time-series, live mode with progress.
4. Run actions: cancel, pause/resume (where applicable), re-run, clone, export CSV/JSON, tag, note, attach, compare, mark baseline, delete.
5. Run compare view.
6. Templates page (list, create, edit, delete, duplicate, import, export).
7. Schedules page.

E2E tests for the critical flow: New Run → Live run → Drill-in → Compare. **STOP.**

### Checkpoint E — Logs, Reports, OTA
1. Logs page: filters, virtualized table, tail mode, bookmarks, saved views, export, run correlation.
2. Reports: one-off PDF/HTML generation, scheduled email reports, custom templates.
3. OTA: upload, verify, diff, trigger, progress, history, rollback, post-upgrade smoke test.

Run tests. **STOP.**

### Checkpoint F — Settings, Help, polish
1. Settings tabs: Board, Versions, Account, Notifications, Data, Display, Network, Advanced.
2. First-run wizard.
3. Help page + per-module documentation links + "what's new" changelog.
4. Audit log viewer.
5. Accessibility pass.
6. Performance pass (virtualization verified on 10k rows).
7. Production build verified.
8. Dockerfile multi-stage, non-root.
9. README: run locally, env vars, regenerate types, add a custom renderer, add a new settings tab.

Final test run. Final report.

---

## 12. Hard rules

- The UI talks to the Server App only via documented REST. Never directly to the board. Never to the database.
- No hardcoded module names, schemas, or field lists. Everything reads from the server's module registry.
- One form builder, one generic renderer. Module-specific code lives only in the renderer registry as overrides.
- Sidebar must reflect the **actual** HAL module inventory of the configured board, not a static catalog.
- The board header is **always** visible. Never hidden by overlays, modals, or focused views — except the login page.
- Generated proto types and generated API client are build output. Not committed as authoritative source.
- No new state management library beyond Section 7.
- If the server's actual API contradicts this prompt, the server wins — stop and report.
- If you find yourself writing a switch over `module_id` outside the renderer registry, stop and ask.
- If a feature in Section 6 conflicts with what the server actually offers, stop and ask — do not silently degrade.
- shadcn primitives' accessibility defaults must not be replaced with custom divs.

## 13. Deliverables

At end of Checkpoint F:
- Working Web UI runnable via `npm run dev` against a running Server App.
- `next build` succeeds for production.
- Dockerfile producing a small runnable image.
- Passing test suite with coverage report.
- README sufficient for a new developer to be productive in under an hour, covering: local dev, env vars, regenerating proto types, adding a custom module renderer, adding a settings tab, the schema-driven form builder.
- An "Ambiguities resolved" log: every decision made with rationale.

Begin with Checkpoint A.