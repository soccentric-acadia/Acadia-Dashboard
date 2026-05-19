# Web UI Final Redesign — Proto-Driven, Always-Rendered, Simulation-Capable

You are rebuilding the **Acadia Dashboard** (`Acadia-Dashboard/`). The current UI has the right bones but the wrong philosophy. This redesign locks in a different mental model: the UI is a **complete, standalone instrument panel** that knows the hardware from the protos themselves, renders everything regardless of connectivity, and can run fully simulated when no server is reachable.

This is a long-running task. **No time limit, no cost limit.** Feature completeness, the always-rendered guarantee, proto-as-source-of-truth, and a flawless simulation experience are the constraints.

---

## 1. Workspace

```
Acadia/
  Acadia-OS/
  Acadia-HAL/           ← protos canonical here; UI builds against these
  Acadia-Client/
  Acadia-Server/
  Acadia-Dashboard/     ← the target of this redesign
  Acadia-FakeBoard/
```

This redesign touches **only** `Acadia-Dashboard/`. Do not modify HAL, protos, Server, Client, or FakeBoard. Where the redesign requires a server endpoint or proto field that doesn't exist, document it as a follow-up — do not silently patch other repos.

---

## 2. The five non-negotiable principles

These are the design and architectural commitments. Everything below serves them.

1. **The protos are the hardware definition.** Module list, module fields, module schemas, statuses, severities, typed values — everything the UI needs to know about hardware comes from `Acadia-HAL/protos/` and `Acadia-HAL/protos/registry/modules.yaml`. **Not from the server.** The UI builds against the protos at build time and ships the module catalog as static, compiled-in data.

2. **Always rendered, never gated.** Every component, every page, every module page, every sidebar entry, every form — renders whether or not the UI is connected to a server. Disconnection is an *indicator*, not a state that hides functionality. There is no "connect a board to see modules" empty state. There is no "no data yet" blank screen. Empty states exist, but they are designed instrument readouts (showing "—" with dashes), never "go set this up first" call-to-actions.

3. **Test type is a radio group, not a journey.** The four execution modes (single-shot, long-term, monitoring, event-based) are a single inline radio group, not a 4-card stepper. The operator picks one in a single click, and the rest of the configuration adapts inline. No wizard, no multi-step flow for picking the mode.

4. **Simulated mode is a first-class capability, not a fallback.** The UI ships with a complete simulation engine that produces realistic streaming results for every module. Simulated mode is reachable via an explicit toggle in the top bar AND is the automatic fallback when no server is reachable. In simulated mode, the UI is 100% functional — launch runs, see streaming results, drill in, chart, compare runs, configure thresholds, view OTA flows. Nothing is greyed out.

5. **Hardware is identical across all boards.** There is no per-board hardware inventory. The proto-derived module catalog is the inventory. Boards differ only by ID. The sidebar lists hardware modules unconditionally, always, in every state.

---

## 3. Architectural decisions — locked

### 3.1 Proto consumption (build-time, not runtime)

- A build step (`scripts/generate-from-protos.ts`) reads `Acadia-HAL/protos/` and `Acadia-HAL/protos/registry/modules.yaml` and generates:
  - **TypeScript types** for every message (`src/proto/generated/`).
  - **A module catalog manifest** (`src/proto/module-catalog.ts`) — a `Record<string, ModuleDefinition>` keyed by `module_id`, with category, display name, icon hint, Config schema descriptor, Result schema descriptor, observable metric keys, monitoring keys, event keys.
  - **A schema descriptor for every module** — derived from the proto, used by the schema-driven form builder and the schema-driven result renderer.
- The generated catalog is **the** source of truth. The UI does **not** call `/api/v1/modules` at runtime. (If the server endpoint exists, it's used only to verify the server agrees — a developer warning if drift is detected, never a runtime gate.)
- Regeneration happens automatically as a `prebuild` and via `pnpm gen` / `npm run gen`.

### 3.2 The connection-state model

The UI has exactly four connection states. Every page handles all four.

- **Live** — connected to a real server; real data flowing.
- **Reconnecting** — was connected; lost the connection; retry loop active.
- **Offline** — never connected this session, or chose not to be.
- **Simulated** — operator explicitly selected simulation, OR auto-fell back to it after extended disconnection.

State is exposed as a single `useConnectionState()` hook backed by a Zustand store. The header surfaces a compact pill showing the state + a tiny dot animation tuned to the state (pulsing live cyan / spinning amber / hollow gray / electric purple).

The transition rules:

- App boots in **Offline**. As soon as the API client confirms a healthy server, transitions to **Live**.
- A connection drop transitions **Live → Reconnecting**, retries with exponential backoff for 30 s, then **Reconnecting → Simulated** with a small toast: "Lost connection — running in simulated mode. Data will not be synced."
- Operator can manually toggle: **Live ⇄ Simulated** at any time via the header pill (right-click or click → menu).
- Returning from **Simulated → Live** keeps simulation data in the local store (does not push to server); a banner notes "Simulated data not synced."

### 3.3 Simulation engine

A complete in-browser simulation of the entire backend. Lives at `src/sim/`.

- **In-memory store** (Zustand + persisted to IndexedDB) holding: runs, results, templates, schedules, thresholds, baselines, notifications, audit log, OTA history.
- **Result generator** that, for every module in the catalog, produces synthetic results in every mode:
  - **Single-shot**: one result per enabled module, with realistic metric values (drawn from the module's schema and a per-module realistic-range profile).
  - **Long-term / monitoring**: streams results at the configured frequency via `requestAnimationFrame`-driven ticks; metric values drift, oscillate, occasionally spike per a small library of behavior profiles.
  - **Event-based**: only emits when the simulated condition trips; the operator can trigger one manually via a "Fire event" button on the run detail.
- **Profile presets** (mirroring `Acadia-FakeBoard`'s profiles) — healthy / thermal-throttling / memory-degraded / sensor-noisy / catastrophic. Selectable in Settings → Simulation.
- **Fault injection** in simulated mode — operator can pin a module to any `Status`, change its severity, set `error_message`, all from the module page. Useful for demos and screenshot evidence.
- **Deterministic mode** — optional seeded RNG. Two runs with the same seed produce identical result streams. Useful for visual regression.
- **No server required.** Simulated mode does not require any backend at all. The UI is fully usable standalone.

### 3.4 Source-of-data abstraction

Every page reads from a unified **data layer** that resolves to the live API client OR the simulation engine based on the current connection state. Pages never know which is which.

```
src/data/
  index.ts                  # the unified API: getRuns(), startRun(), etc.
  live/
    client.ts               # wraps openapi-fetch
    sse.ts                  # live streams
  sim/
    engine.ts               # the simulation engine
    persistence.ts          # IndexedDB
    profiles.ts             # behavior profiles
    rng.ts                  # seeded RNG
  resolver.ts               # picks live or sim per connection state
```

Pages call `useRuns()`, `useRun(id)`, `useResultStream(runId, moduleId)`, etc. The hook implementations route to live or sim transparently.

This is the load-bearing architectural decision. Without it, every page would have two implementations.

### 3.5 Test-type radio group (not a journey)

The four modes are rendered as a **single inline `<RadioGroup>`** in the New Run page. Selecting a mode re-renders the inline configuration below it (frequency input appears for long-term, etc.). No step navigation. No "next" button until the user is ready to launch.

The page is a single dense form, not a stepper. Operator can edit name, mode, modules, and configs all on one screen.

---

## 4. The complete UI — explicit, page by page

### 4.1 Global layout

Persistent across every page except login (login is a focused single-card page).

**Top bar** (56px, sticky):
- Left: product wordmark + horizontal `<NavigationMenu>` (Dashboard · Runs · New Run · Templates · Schedules · Logs · Reports · OTA · Settings · Help).
- Center: board identity chip (monospace board ID + connection state pill).
- Right: ⌘K quick search trigger · live activity pulser (visible during active run) · notifications bell · theme toggle · user menu.
- The connection state pill is the **only** place connection state is surfaced — never as a full-screen modal, never as a blocking interstitial.

**Vitals strip** (32–40px, under top bar, sticky):
- A horizontal row of compact readouts derived from the actual streaming data when Live, simulated values when Simulated, or "—" placeholders when Offline.
- Readouts: CPU temp, CPU load, RAM used, uptime, network state, current activity ("Idle" / "Running: run-name + sequence").
- Each readout is a `<Badge>` with a tiny inline trend arrow. **The strip never disappears.** Offline state shows "—" in monospace.

**Left sidebar** (280px expanded, 64px collapsed):
- The literal HAL module list from the proto-derived catalog, grouped by category.
- Always shown. Never gated by connection state.
- Each row: icon + name + status dot (driven by the last known result for that module, or "NEVER" if no result yet) + small relative timestamp + inline 12-point sparkline of the primary metric.
- Filter input at top filters by name across all categories.
- Bottom-of-sidebar: "Active run" card during a run (live, simulated, doesn't matter), with progress + abort button.

**Main content area**: right of sidebar, below vitals strip. Page-specific.

**Toast region**: bottom-right via `sonner`. Animated entrance, dismiss-on-click, stacks.

### 4.2 Login (`/login`)

- Focused single card. Username + password.
- Theme toggle in corner.
- A small link beneath: **"Continue in simulated mode →"** — bypasses auth, drops the operator into a full simulated session for demos. Documented prominently in Settings as the demo mode.

### 4.3 Dashboard (`/`)

The instrument console.

**Top row — KPI cards (`<KpiCard>` × 4–6):**
- Board card: status pill, uptime, OS/HAL/Client/Server/UI versions in monospace (in Simulated mode, shows synthetic versions tagged `(sim)`).
- Active run: title + UUID short + mode badge + circular `<Progress>` + abort. When idle, collapses to a "No active run" CTA pointing to New Run.
- Pass rate (rolling 24h): big percentage + sparkline + delta.
- Failures this week: count + severity stacked bar + "View" link.
- Test throughput: results/min + area chart.
- System health: server reachable / DB latency / gRPC stream count / ingest rate. In Simulated mode, shows "Simulation engine: nominal."

**Second row — Live module grid:**
- One tile per module in the catalog, packed 4–8 per row depending on width.
- Tile: icon + name + status dot + 60-second sparkline + last-result timestamp.
- Running tiles pulse; recently-completed tiles flash green/red briefly.
- Click → module page.

**Third row — split panes (`<Resizable>`):**
- Left 60%: live results stream (virtualized, newest at top, animated insertion).
- Right 40%: recent failures feed (scrollable, compact cards, hover for detail).

**Fourth row — Pinned runs carousel** (`<Carousel>`).

**Fifth row — Run history table** (`<DataTable>`, server-paginated when Live, in-memory paginated when Simulated; same UI either way).

Every region is a `<SectionCard>` with subtle hover lift. The whole page is dense, animated, and full of useful data — including when in Simulated mode.

### 4.4 Module page (`/modules/[moduleId]`)

The single deepest page. Reached from sidebar.

**Module header:**
- Large icon (`<ModuleIcon>`) + module name + category breadcrumb.
- Right: live status badge + severity + last-tested relative + absolute (tooltip) + live status dot.
- All data comes from the catalog (static fields) + last known result (dynamic fields) — works identically Live or Simulated.

**Tabs (`<Tabs>`):**

- **Overview** — last result via generic renderer, side panel with enable toggle + config preview + notes, live "recent values" mini-chart of primary metric.
- **History** — virtualized table of all past results for this module across runs; expand rows to full renderer; click numeric metric → adds to trend chart.
- **Trend** — multi-line Recharts of selectable numeric metrics over time; brushable for zoom; threshold reference lines; anomaly markers.
- **Distribution** — histogram + stats sidebar (count, mean, median, p95, p99, stdev).
- **Heatmap** — runs × tests grid colored by status.
- **Threshold** — typed-value threshold editor per metric.
- **Config** — schema-driven form builder rendering this module's Config schema (read-only preview); side panel explains each field from proto comments.
- **Raw** — decoded proto payload of last result as syntax-highlighted JSON tree.
- **Simulate** (only visible in Simulated mode) — pin status, pin severity, fire an event, set fault injection. Lets the operator drive what this module reports.

Tabs render fully even with zero data (empty states are designed readouts, not CTAs).

### 4.5 New Run (`/runs/new`)

Single dense form, no stepper.

**Section 1 — Identity:**
- Run name (`<Input>`), description (`<Textarea>`), tags (`<ToggleGroup>` for common + free-text add).

**Section 2 — Mode (single inline radio group):**
- `<RadioGroup>` with four `<RadioGroupItem>` cards, side by side:
  - **Single-shot** — "Run once, get one result per module"
  - **Long-term** — "Run repeatedly at a frequency, stream results"
  - **Monitoring** — "Long-term + capture environmental extras per result"
  - **Event-based** — "Run continuously, emit only when condition trips"
- Picking a mode immediately changes what fields appear in Section 3.

**Section 3 — Modules & per-module config:**
- Three columns inside this section:
  - Left: module list grouped by category, each row a checkbox + name + status dot + short description. Search at top. Bulk: enable all / by category / clear.
  - Center: list of enabled modules. Each module is a `<Card>` with:
    - Mode-aware fields at the top (frequency for long-term/monitoring, monitoring extras for monitoring, event condition for event-based).
    - Module-specific config below (schema-driven form builder).
    - Per-module notes textarea.
  - Right: live summary card — count of enabled modules, estimated wall-clock duration, warnings.

**Section 4 — Actions:**
- Action bar at bottom: `Dry-run / Validate`, `Save as Template` (`<Dialog>`), `Schedule for later` (`<Popover>` with calendar + cron input), `Start Now` (primary, with `<AlertDialog>` confirm).

All editing happens inline. No "next step." The operator sees the whole configuration at once.

### 4.6 Runs list (`/runs`)

A paginated `<DataTable>` of runs. Rich columns: name, UUID short, mode badge, started, duration, status, pass/fail counts, tags, actions menu. Filters: status, mode, tag, date range, free-text. Bulk actions: delete, export, tag. Works identically Live and Simulated.

### 4.7 Run detail (`/runs/[runId]`)

The live operations center.

**Run header:**
- Run name + UUID + mode + status + severity + started/ended + elapsed.
- Action bar: cancel (when running), pause/resume (where mode permits), re-run, clone, export (CSV/JSON), generate report, tag, attach files, mark baseline, delete.
- When live, pulsing border via `motion`.

**Body (two `<Resizable>` panes):**
- Left (40%): per-module summary list. Each row: module icon + name, status badge (PASS/FAIL/NEVER/ABORTED), result count, last timestamp, mini-sparkline. Click selects.
- Right (60%): selected module's results in this run — top chart, below virtualized table of results. Click numeric in row expansion → add to chart.

**Live mode behavior:**
- New results animate in via `<AnimatePresence>`.
- Chart updates incrementally.
- Progress bar in the run header reflects fraction complete (if computable; indeterminate shimmer otherwise).

**Logs sidecar:**
- Toggle `<Sheet>` from the right edge: logs filtered to this run's window, live-tailing during active runs.

**Simulated mode addition:**
- A "Simulation controls" `<Sheet>` toggle: change profile mid-run, inject a fault, fire an event, accelerate time. Available only in Simulated mode.

### 4.8 Run compare (`/runs/compare?a=&b=`)

Side-by-side per-module diff.

- Two run-pickers as `<Command>` search inputs at top.
- `<DataTable>` per `(module_id, test_id)`: Module · Test · Status A → Status B · Primary metric A → B (with delta % + arrow) · Category badge (`unchanged/improved/regressed/drifted/disappeared/appeared`).
- Top summary chips: counts per category, colored.
- Row click → side `<Sheet>` with full diff (both result detail views side by side).

In Simulated mode, comparison logic runs locally against the in-memory store.

### 4.9 Templates (`/templates`)

Card grid (default) or `<DataTable>` toggle. Each card: name + mode badge + module count + last used + created by + action menu. Click → New Run prefilled.

### 4.10 Schedules (`/schedules`)

`<DataTable>`: name, template, cron / one-time datetime, enabled toggle, last run (status + relative), next run (countdown). Inline `<Switch>` for enable/disable. Row click → side `<Sheet>` with execution history mini-timeline.

In Simulated mode, schedules fire against the simulation engine on the same cadence.

### 4.11 Logs (`/logs`)

Console-like view, monospace.

- Filter bar: source chip group (kernel/syslog/app) + severity chip group + time range (`<Popover>` + `<Calendar>`) + free-text `<Input>`.
- Tail toggle `<Switch>`.
- Virtualized list: timestamp · severity glyph · source · message (truncated, expand on click).
- Right sidebar: bookmarks, saved views, export button.
- Correlation: `result_id` query param scrolls to the timestamp window and highlights.

In Simulated mode, logs are synthetic but follow realistic patterns (kernel boot messages, periodic syslog noise, app log lines tied to run events).

### 4.12 Reports (`/reports`)

Three tabs: Generate / Templates / Schedules. Generate tab — pick run via `<Command>` + template + format (PDF/HTML radio cards) + go.

In Simulated mode, the UI renders the report client-side (HTML) without server involvement.

### 4.13 OTA (`/ota`)

Heavily instrumented page.

- Current versions card at top (monospace, large).
- Upload card with drop zone, file picker, progress bar.
- Verification card: step-by-step list with animated checkmarks (checksum, signature, manifest parse).
- Diff card: current vs target versions, changelog.
- Action card: "Apply Upgrade" behind `<AlertDialog>`; live progress `<Sheet>` opens during.
- History table: from→to, status, who, when, rollback button per row.

In Simulated mode, OTA flow runs through synthetic stages with realistic timing — useful for demos and screenshots.

### 4.14 Settings (`/settings`)

Tabbed:

- **Board** — board ID, tags (rename), versions (OS/HAL/Client/Server/UI). In Simulated mode, versions tagged `(sim)`.
- **Connection** — server URL, retry settings, **simulation toggle** with profile selector, deterministic mode + seed input.
- **Account** — change password, API tokens.
- **Notifications** — rules + channels (in-app, email).
- **Data** — retention policy, backup (in Simulated mode: backup/restore IndexedDB), restore.
- **Display** — theme, time zone, date/time format, keyboard shortcuts viewer.
- **Network** — connection diagnostic action.
- **Advanced** — audit log, raw payload viewer default, **simulation engine debug panel** (seed, profile, fault injection state, store size).

### 4.15 Help (`/help`)

Documentation cards. Tooltips reference. Keyboard shortcuts in `<Table>` with `<kbd>`. "What's new" markdown changelog. **A "Tour the UI in simulated mode" CTA** that starts a guided walkthrough.

### 4.16 First-run / always-available demo

If the operator clicks "Continue in simulated mode" on login, the UI loads into simulated mode with the `healthy` profile, a small banner explains the mode, and a "What is simulated mode?" link in the help center is highlighted. The first-run wizard runs through: explore the board, configure a single-shot run, watch results stream, drill into a module, set a threshold, mark a baseline.

---

## 5. Component vocabulary — required usage

Use these extensively. If a primitive exists, use it.

### shadcn/ui
`Accordion`, `Alert`, `AlertDialog`, `AspectRatio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`, `Chart`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `DataTable`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `Input`, `Label`, `MenuBar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Slider`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`.

### Libraries
- **Recharts** via shadcn Chart for all charts.
- **motion** (formerly framer-motion) for all transitions.
- **lucide-react** for all icons.
- **TanStack Table** for any non-trivial table.
- **TanStack Query** for server state (used only in Live mode; the data resolver short-circuits to the sim engine otherwise).
- **Zustand** for client state (connection state, simulation engine, preferences).
- **cmdk** under `<Command>` for ⌘K.
- **next-themes**.
- **idb-keyval** (or `Dexie`) for IndexedDB persistence of simulated data.
- **seedrandom** for deterministic RNG.

If a component genuinely doesn't exist in shadcn, build it from shadcn primitives. Don't reach outside.

---

## 6. Custom primitives — required, reused

Every visual concept has one canonical primitive. No duplicates.

- `<StatusBadge status severity size>` — one component for every status pill.
- `<LiveDot state>` — animated indicator (states: idle, running, pass, fail, error, timeout, skipped, aborted, never, disconnected, simulated).
- `<ConnectionPill state>` — the top-bar connection state pill (Live, Reconnecting, Offline, Simulated).
- `<ModuleIcon moduleId>` — looks up the right lucide icon for the module's category.
- `<Sparkline data />` — micro chart for sidebar rows, dashboard tiles, run-detail summaries.
- `<KpiCard title value delta sparkline icon />` — dashboard KPI tiles.
- `<SectionCard title actions>{children}</SectionCard>` — the page region wrapper.
- `<CountUp value />` — animated number transitions.
- `<PulseRing intensity />` — reusable live indicator.
- `<GenericResultRenderer result />` — the schema-driven result view; used everywhere a result is shown.
- `<SchemaForm schema value onChange />` — the schema-driven form builder.
- `<EmptyReadout label />` — the "instrument empty state" — shows "—" in monospace, never a CTA.

If you find yourself recreating any of these JSX inline in a page, extract it.

---

## 7. Motion system

Use `motion/react` for every transition. Spec:

- Page transitions: fade + 8px y-translate, 200ms ease-out.
- Sidebar collapse: width `layout`, 250ms `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Tab switches: fade-slide (12px x), 180ms.
- List inserts/removes: `<AnimatePresence>` + `motion.li`, slide-down-and-fade in, slide-up-and-fade out.
- Live result arrival: 1 → 1.02 → 1 scale bump + ring color pulse, 200ms.
- Status badge change: color cross-fade 200ms; if worsens, 1px ring pulse.
- KPI count-ups: 600ms ease-out via `useMotionValue` + `useTransform`.
- Chart line draws: 400ms `pathLength` animation on new segments.
- Hover lifts: `whileHover={{ y: -2 }}`, spring 400/30.
- Pulse on live indicators: 1.5s opacity/scale loop; pause under `prefers-reduced-motion`.
- Sheet / Drawer / Dialog entrances: shadcn defaults.
- Skeleton shimmer: shadcn defaults.

**`prefers-reduced-motion` honored everywhere.** No animation is required for state communication — color and shape carry meaning.

---

## 8. Visual language

### Typography
- Display: Geist (or Inter Display) — page titles, KPIs.
- Body: Geist regular.
- Monospace: JetBrains Mono or Geist Mono — board IDs, UUIDs, versions, log lines, metric values, code-like data.

### Color
- Dark mode primary; light mode fully supported but secondary.
- Status palette:
  - PASS — emerald
  - FAIL — red
  - ERROR — deep crimson
  - TIMEOUT — amber
  - SKIPPED — gray
  - ABORTED — violet/purple
  - NEVER — hollow ring on muted
  - RUNNING — cyan, pulsing
  - DISCONNECTED — hollow muted
  - SIMULATED — electric purple (used for the connection pill and small "(sim)" labels on synthetic data)
- Severity overlay: WARNING soft ring, ERROR red ring, CRITICAL thick red ring with subtle pulse.

All colors come from shadcn theme tokens. No hex literals in components.

### Iconography
- `lucide-react` everywhere.
- Module icons: per category. CPU → `<Cpu>`, Memory → `<MemoryStick>`, Storage → `<HardDrive>`, Network → `<Network>`, Sensors → `<Thermometer>` / `<Gauge>` / `<Wind>`, GPIO → `<Cable>`, etc.

### Density
- `gap-3` / `gap-4` default — tighter than typical SaaS.
- Card padding 16–20px in most places.
- Tables 36px row height; monospace for technical columns.

---

## 9. Required project layout

```
Acadia-Dashboard/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  components.json
  .env.example
  README.md
  scripts/
    generate-from-protos.ts        # reads ../Acadia-HAL/protos/, writes src/proto/generated/ + module-catalog.ts
    generate-api-client.sh         # generates from server OpenAPI (when available)
  src/
    app/
      layout.tsx                   # global shell: top bar, vitals strip, sidebar
      page.tsx                     # dashboard
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
        top-bar.tsx
        vitals-strip.tsx
        sidebar-modules.tsx
        command-palette.tsx
        user-menu.tsx
        connection-pill.tsx
      primitives/                  # the canonical primitives from §6
      dashboard/
      modules/
      runs/
      results/
        renderers/
          generic.tsx
          registry.ts
      logs/
      ota/
      settings/
      forms/
        schema-form/
          index.tsx
          field-renderers/
          zod-from-schema.ts
      mode-fields/                 # mode-specific fragments rendered inline in New Run
        single-shot.tsx
        long-term.tsx
        monitoring.tsx
        event-based.tsx
    proto/
      generated/                   # build output, gitignored
      module-catalog.ts            # build output, gitignored
      types.ts                     # canonical re-exports
    data/                          # the unified data layer (§3.4)
      index.ts
      resolver.ts
      live/
        client.ts
        sse.ts
      sim/
        engine.ts
        persistence.ts
        profiles.ts
        rng.ts
        generators/                # per-mode result generators
    state/
      connection.ts                # Zustand store for connection state
      preferences.ts               # Zustand store for theme, density, etc.
    lib/
      value/typed.ts               # TypedValue helpers
      status/index.ts              # Status / Severity helpers
      auth/session.ts
      board/context.tsx
      utils/
    hooks/
    motion/
      presets.ts
    styles/
      globals.css
  tests/
    unit/
    e2e/
```

---

## 10. Workflow — phases

Long-running, no human gates. Reports under `Acadia-Dashboard/redesign_log/`.

### Phase 1 — Bootstrap
- Locate `Acadia-HAL/protos/` and `Acadia-HAL/protos/registry/modules.yaml`. Confirm the proto layer has the new shape (`TestStatus`, `TestSeverity`, `TypedValue`, `TestOutput`, `TestResult`).
- If protos are stale, **stop and report** — do not proceed against an outdated spec.
- Inventory current Dashboard: pages, components, dependencies, theme.
- Plan shadcn primitive installation list.

Write `redesign_log/01_bootstrap.md`.

### Phase 2 — Proto-to-UI build pipeline
- Implement `scripts/generate-from-protos.ts` producing:
  - `src/proto/generated/*.ts` (typed messages).
  - `src/proto/module-catalog.ts` (the catalog manifest).
  - `src/proto/types.ts` (canonical re-exports).
- Wire as `prebuild`. Run it. Inspect generated catalog.
- Add unit tests confirming every module in `modules.yaml` appears in the generated catalog with the expected fields.

Write `redesign_log/02_proto_pipeline.md`.

### Phase 3 — Foundations
- Install missing shadcn primitives (Sidebar, Resizable, Carousel, Command, Chart, etc.).
- Install `motion`, `idb-keyval` (or Dexie), `seedrandom`.
- Update Tailwind config with status tokens (including SIMULATED and DISCONNECTED).
- Build the canonical primitives from §6: `<StatusBadge>`, `<LiveDot>`, `<ConnectionPill>`, `<ModuleIcon>`, `<Sparkline>`, `<KpiCard>`, `<SectionCard>`, `<CountUp>`, `<PulseRing>`, `<EmptyReadout>`.
- Unit tests for each.

Write `redesign_log/03_foundations.md`.

### Phase 4 — Connection state + data resolver + simulation engine
- Implement `useConnectionState()` and the Zustand store with the four states + transition rules.
- Implement the `data/` layer: `resolver.ts` + `live/` + `sim/`.
- Build the simulation engine with:
  - In-memory + IndexedDB persistence.
  - Per-mode generators producing realistic streams for every module in the catalog.
  - Profiles (healthy / thermal-throttling / memory-degraded / sensor-noisy / catastrophic).
  - Fault injection API.
  - Deterministic seeded mode.
- Unit tests covering: launch a simulated single-shot for every module; long-term streaming for at least 3 modules; deterministic-replay reproducibility.

Write `redesign_log/04_data_and_sim.md`.

### Phase 5 — Global shell
- Build top-bar, vitals strip, sidebar, command palette, user menu, connection pill.
- Wire vitals strip to the data layer (so it shows real Live values when connected, simulated when in Sim mode, "—" when Offline).
- Verify sidebar always renders the full module list from the catalog regardless of connection state.

Write `redesign_log/05_shell.md`.

### Phase 6 — Schema-driven form builder + generic result renderer
- Build `<SchemaForm>` consuming the module catalog's Config schema descriptor.
- Build `<GenericResultRenderer>` consuming the module catalog's Result schema descriptor and a `TestResult`.
- Both must handle every TypedValue variant, every Status, every Severity, recursive subtests.
- Renderer registry pattern in place, registry empty.
- Unit tests covering every module's Config form rendering and a representative result rendering per module.

Write `redesign_log/06_schema_driven.md`.

### Phase 7 — Pages, in order
- Dashboard (§4.3).
- Module page with all 8 tabs (plus Simulate tab in Sim mode) (§4.4).
- New Run with the single-page radio-group-driven form (§4.5).
- Runs list (§4.6).
- Run detail (§4.7).
- Run compare (§4.8).
- Templates, Schedules, Logs, Reports, OTA, Settings, Help, Login (§4.9–4.16).
- Each page tested for Live AND Simulated mode behavior.

Write `redesign_log/07_pages.md`.

### Phase 8 — Motion + polish
- Apply animation presets from `motion/presets.ts` consistently.
- Verify `prefers-reduced-motion` everywhere.
- Hover/focus states on every interactive element.
- Micro-interactions where they earn their keep.
- Remove any decorative-only animation.

Write `redesign_log/08_motion.md`.

### Phase 9 — Accessibility + performance
- Keyboard nav audit per page.
- Screen-reader audit on key components.
- Contrast audit (light + dark).
- Virtualization on result and log tables.
- Memoization on heavy chart inputs.
- Lighthouse run on `/`, `/runs/[runId]`, `/modules/[moduleId]` — target ≥ 80 Performance.
- Production bundle size check (`next build` first-load JS < 500 KB compressed for `/`).

Write `redesign_log/09_a11y_perf.md`.

### Phase 10 — End-to-end verification
- `next build` clean.
- `tsc --noEmit` clean.
- Unit tests green.
- Playwright E2E suite green covering:
  - Login → Live mode → run a single-shot → drill in → chart → mark baseline → compare.
  - Login → Simulated mode → same flow end-to-end without a server.
  - Disconnect mid-run → reconnect → state correct.
  - Disconnect for 30s → auto-fall-back to Simulated → continue → manual return to Live.
  - Every page renders correctly with no connection (Offline).
- Capture evidence under `redesign_log/evidence/`.

Write `redesign_log/10_final.md`.

---

## 11. Hard rules

- **The protos are the hardware definition.** Module list, schemas, statuses, severities — all from `Acadia-HAL/protos/`. The server is not consulted for hardware metadata at runtime.
- **Always rendered.** Every page, every component, every module, every form — renders regardless of connection state. No "no board configured" empty states, no blocking modals based on connectivity.
- **Connection state is a visible indicator, never a gate.** Just a pill in the top bar.
- **Test type is a radio group, not a flow.** Single inline `<RadioGroup>` in New Run; configuration adapts beneath it.
- **Simulated mode is first-class.** Full functionality, no greyed-out features. Reachable via explicit toggle + automatic fallback after 30 s disconnection.
- **Hardware is identical across boards.** No per-board inventory. Sidebar uses the proto catalog unconditionally.
- **No `switch(module_id)`** outside the renderer registry. Anywhere.
- **No hex literals in components.** Theme tokens only.
- **`prefers-reduced-motion` honored.**
- **One canonical primitive per visual concept.** No duplicates.
- **Generated code is build output.** Never committed as authoritative source.
- **No new heavyweight dependencies** beyond what §5 lists.
- **No edits to HAL, protos, Server, Client, or FakeBoard** as part of this redesign.
- **Top bar + vitals strip + sidebar are visible on every page** except login.
- **The sidebar lists modules from the proto catalog**, never from a runtime fetch.
- **Empty states are designed readouts ("—" in monospace), never CTAs.**

---

## 12. Deliverables

At Phase 10 completion:

- `Acadia-Dashboard/` rebuilt against the principles in §2.
- A complete proto-to-UI build pipeline (Phase 2) producing the module catalog from the HAL protos at build time.
- A complete in-browser simulation engine (Phase 4) with profiles, fault injection, deterministic mode, IndexedDB persistence.
- Every page redesigned per §4.
- Every primitive in §6 implemented and used consistently.
- Motion system applied per §7.
- Production build passing (`next build`).
- `tsc --noEmit` clean, strict mode.
- All unit + Playwright E2E tests green, including the simulation-mode E2E flows.
- Lighthouse Performance ≥ 80 on key pages.
- A short demo recording (≤ 2 min) walking the dashboard, a Simulated run, drill-in, compare, captured under `redesign_log/evidence/`.
- README updated: how to run, theme tokens reference, design principles, how the proto build pipeline works, how to add a new module category, how the simulation engine works, how to add a custom result renderer.
- All phase reports under `redesign_log/01_…` through `redesign_log/10_final.md`.

Begin with Phase 1.