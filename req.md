review the cadia-Client  Acadia-HAL  Acadia-Server fist to aget all the info 

# Web UI Redesign — Modern, Component-Rich, Single-Board Dashboard

You are **redesigning the Web UI** for an Independent Validation & Verification (IV&V) tool suite. The existing UI works but looks dated and underuses the component library. The goal is a **modern, dense, animated, component-rich dashboard that feels like a real piece of hardware diagnostic equipment** — not a generic CRUD admin panel.

This is a redesign, not a rewrite. The tech stack stays. The data flow stays. The information architecture changes (sidebar/nav reorganized), and every screen is rebuilt against a richer component vocabulary with motion, polish, and density appropriate to a hardware dashboard.

This is a long-running task. Time is not a constraint. **Visual quality, interaction polish, component density, and the "real instrument" feel are the constraints.**

---

## 1. The product, in one paragraph

This UI is the only operator-facing surface for a hardware Independent Validation & Verification tool. It connects to **one board at a time**. Every board the system ever sees has **identical hardware** — same SoC, same peripherals, same sensors, same HAL module inventory. Boards differ only by an ID. The sidebar therefore displays the hardware modules **unconditionally** — not derived from any per-board inventory, not gated on a "board configured" state. The operator picks a **test mode** (single-shot, long-term, monitoring, event-based) and enables modules to run. The UI's job is to make the operator feel like the board's silicon is laid out in front of them and they're driving it directly.

---

## 2. Design principles — hard

1. **"It's a real instrument."** The reference is a piece of lab gear (oscilloscope, logic analyzer, BMC dashboard, telemetry console), not a SaaS admin panel. Dense readouts, live indicators, micro-charts inline, monospace for technical data, sharp edges over rounded marshmallows.
2. **Motion is meaning.** Animations communicate state — pulse on live, fade on stale, shimmer on streaming. No decorative motion. Every animation has a purpose; everything respects `prefers-reduced-motion`.
3. **Component density.** Every screen is layered: cards within cards, micro-charts in table cells, status overlays on icons, live counters in headers. The dashboard should feel *full* without feeling cluttered — achieved through hierarchy (scale, weight, color), not whitespace alone.
4. **Modules are first-class citizens.** They are the persistent left-hand presence. The user navigates *through* hardware, not around it.
5. **Top nav for context, sidebar for hardware.** The top is for app-level destinations (Dashboard, Runs, New Run, Templates, Schedules, Logs, Reports, OTA, Settings, Help) and the user/board context. The sidebar is *exclusively* the hardware module inventory, grouped by category, always visible (collapsible).
6. **One board, never multi.** No board pickers. Board identity surfaced as an ID chip in the top bar. Boards are interchangeable from a UI structure standpoint — the same shape, just a different ID.
7. **shadcn-rich.** Use the full library. If shadcn has a primitive that fits, use it instead of a div. Default to compositions of shadcn primitives before reaching for custom components.
8. **Dark mode is the default.** Lab-instrument aesthetic. Light mode is supported and must be excellent, but the design language is dark-first.

---

## 3. The non-negotiable layout

### 3.1 Top bar (replaces the old sidebar nav)

A single horizontal bar across the top, ~56px tall, with three regions:

**Left region:**
- Product mark / logo (small, monospace wordmark).
- Primary navigation as a horizontal `<NavigationMenu>` (shadcn): Dashboard · Runs · New Run · Templates · Schedules · Logs · Reports · OTA · Settings · Help.
- Active route indicated by a subtle underline (`motion.span` layoutId for smooth movement between items).
- Optional `<Command>` palette trigger ("⌘K Quick search") to the right of nav.

**Center region:**
- **Board identity chip** — monospace board ID, status dot (online/offline), uptime ticker, current activity label ("Idle" or "Running: run-name").
- The chip is the only place the user sees the board ID; clicking opens a board-detail dropdown (versions, last seen, model, network).

**Right region:**
- Live activity badge (pulsing dot if a run is active).
- Notification bell with unread count, opens a `<Sheet>` or `<Popover>` of recent alerts.
- Theme toggle (light/dark/system).
- User menu `<DropdownMenu>` — profile, change password, API tokens, audit log, logout.

The top bar is sticky. It glows subtly when a run is active (a 1px gradient border-bottom that animates).

### 3.2 Left sidebar (hardware modules)

Always visible, collapsible to icons-only. Width ~280px expanded, ~64px collapsed.

**Structure:**
- Header row: "Hardware" label + a filter input (`<Input>` with search icon, filters modules by name).
- Grouped sections, each as an `<Accordion>` item (default open):
  - **Compute** — CPU, cores, frequency scaling, etc.
  - **Memory** — RAM, caches, DMA.
  - **Storage** — eMMC, SD, USB storage.
  - **Network** — Ethernet, Wi-Fi, Bluetooth.
  - **Peripherals** — I2C, SPI, UART, GPIO.
  - **Sensors** — temperature, humidity, pressure, IMU, ambient light.
  - **Display / Media** — HDMI, camera, audio.
  - **Power** — rails, current, thermal.
  - (Adapt categories to whatever `modules.yaml` actually defines; do not hardcode a list — read it.)
- Each module row:
  - Icon (`lucide-react`) appropriate to the module class.
  - Module name (monospace, slightly smaller than nav).
  - **Live status dot** — color-coded: idle (gray), running (pulsing blue), PASS (green), FAIL (red), ERROR (deep red), TIMEOUT (amber), SKIPPED (muted), ABORTED (accent), NEVER (hollow circle).
  - **Last-tested timestamp** — relative, very small, muted (e.g., "2m ago").
  - **Inline sparkline** for the most recent numeric metric — 12-point micro-trend, ~50px wide, drawn with SVG or a tiny Recharts variant. Hide on collapsed sidebar.
  - Hover state reveals a `<HoverCard>` with: full last-result summary, quick-enable toggle for next run, "open module page" link.
- Bottom of sidebar: a "Run state" card when a run is active — shows progress, mode badge, elapsed, abort button. Becomes the most visually prominent element on the page when active.

**Hardware modules are displayed unconditionally.** No "no board configured" empty state hides them — they reflect the system's fixed hardware definition, sourced from `modules.yaml`. The only state that affects them is the live status of each module relative to the current run / last run.

### 3.3 Persistent board strip (under the top bar)

A 32–40px strip directly under the top bar, present on every page. This is what makes the user "feel" the board.

- Left: status dot (large, pulsing on live), board ID (monospace).
- Center: a horizontal **vitals row** of live read-outs — CPU temp, CPU load, RAM used, uptime, network state. Each as a `<Badge>` with a tiny inline trend arrow. Updates on a live tick (SSE or polled).
- Right: a "now testing" mini-readout — module being tested + sequence number + tiny progress bar — visible only during an active run.

The strip is the always-on instrument cluster.

### 3.4 Main content area

Right of the sidebar, below the top bar and board strip. Generous padding, but content is dense. Page-specific layouts (Section 5).

### 3.5 Bottom toast region

Top-right or bottom-right via `sonner`. Toasts animate in with a slight bounce, fade, and stack.

---

## 4. Component vocabulary — use these aggressively

Use as many of these as fit. The goal is variety and density. Never settle for a `<div>` if a primitive applies.

### From shadcn/ui
`Accordion`, `Alert`, `AlertDialog`, `AspectRatio`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`, `Chart` (shadcn's Recharts wrapper), `Checkbox`, `Collapsible`, `Command`, `ContextMenu`, `DataTable`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`, `Input`, `InputOTP`, `Label`, `MenuBar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar` (the new shadcn sidebar primitive — use it as the foundation for §3.2), `Skeleton`, `Slider`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`.

### Supporting libraries
- **Recharts** (via shadcn Chart) for all charts.
- **framer-motion** (or `motion/react`) for layout transitions, list reorderings, route transitions, and component-level reveals. Required.
- **lucide-react** for icons. Required.
- **TanStack Table** for any non-trivial table.
- **TanStack Query** for server state (already in stack).
- **react-hook-form + zod** for forms.
- **cmdk** under `<Command>` for the ⌘K palette.
- **next-themes** for theme.

If a component genuinely doesn't exist, build it from shadcn primitives — don't reach outside the library for off-the-shelf widgets.

---

## 5. Page designs — explicit, dense, animated

### 5.1 Dashboard (`/`)

A multi-region instrument console. Use a `<Resizable>` panel group to let the operator tune the layout.

**Top row — KPI cards.** Four to six dense cards:
- **Board** — status, uptime, OS / HAL / Client / Server / UI versions stacked as monospace, last successful run timestamp. Pulsing dot if live.
- **Active run** — large title (run name + UUID short), mode badge, elapsed, progress as a circular `<Progress>` ring, abort button. When idle, this card collapses to a "No active run" + big primary `New Run` button.
- **Pass rate (rolling 24h)** — large percentage, sparkline below, delta vs previous 24h.
- **Failures this week** — count, severity breakdown as a tiny stacked bar, "View" link.
- **Test throughput** — results/min, mini area chart.
- **System health** — server reachable, DB latency, gRPC stream count, ingest rate.

Each KPI card animates value transitions (count-up via framer-motion `animate` on the number).

**Second row — Live module grid.**
- A grid of compact module tiles (4–8 per row depending on width).
- Each tile: icon + name + status dot + tiny 60-second sparkline of its primary metric + last-result timestamp.
- Tiles that are "running" pulse a subtle ring; tiles that just produced a result flash green/red briefly (`motion.div` with a 600ms keyframe).
- Click a tile → module page.

**Third row — split:**
- **Left 60%** — Live results stream. A virtualized list (TanStack Virtual) of the most recent results across all modules, newest at top, animated insertion (`motion.li`). Each row: status badge, module icon, test name, key metric, timestamp, click to expand.
- **Right 40%** — Recent failures feed. A `<ScrollArea>` showing the last N failed/error results as compact cards with `<HoverCard>` for details.

**Fourth row — Pinned runs carousel.** Use `<Carousel>` to show pinned/favorite runs as cards. Each card has a mini status grid (module × status) as a tiny heatmap preview.

**Fifth row — Run history table.** A `<DataTable>` of recent runs (paginated server-side) with rich columns: name, mode badge, started, duration, status, pass/fail counts, tags, actions. Row click → run detail. Use `framer-motion`'s `LayoutGroup` so row removal/sorting animates.

Each region is `<Card>`-wrapped with subtle hover lift (`whileHover={{ y: -2 }}`) and a glass-like border treatment in dark mode.

### 5.2 Module page (`/modules/[moduleId]`)

The deepest, richest single page in the app. Reached by clicking a module in the sidebar or a tile on the dashboard.

**Module header:**
- Large module icon (32px), name in display font, category breadcrumb.
- Right side: status badge (large), severity, last-tested relative + absolute (in a `<Tooltip>`), live-status pulsing dot.
- Below: a `<Tabs>` with the sections (Overview · History · Trend · Distribution · Heatmap · Threshold · Config · Raw).

**Overview tab:**
- **Last result card** rendered via the generic result renderer — status, severity, error_message banner if set, reason kv list, metrics table with inline sparklines per numeric metric, monitoring section, event section, subtests as a nested tree (collapsible).
- Side panel: quick-enable toggle for the next run, per-mode config preview, notes input.
- A live "recent values" mini-chart of the primary metric, last 5 minutes, updating live.

**History tab:**
- Virtualized `<DataTable>` of every past result for this module across runs.
- Filters above: status multi-select chip group, severity chip group, date range, free-text on `reason`/`error_message`.
- Each row expandable into the full generic renderer inline.
- Click a numeric metric in the row's expansion → adds it as a line on the trend chart above.

**Trend tab:**
- Top: metric selector (multi-select chips of numeric keys observed in recent results).
- Main: a large Recharts `<LineChart>` with one line per selected metric, x-axis time, y-axis value (multi-y-axis when units differ). Brushable for zoom. Reference lines for thresholds. Anomaly markers (small icons) at flagged points.
- Right side panel: legend with per-line stats (mean, p50, p95, last value), each clickable to highlight that line.

**Distribution tab:**
- Histogram of values for the selected `(test_id, metric_key)` and time range. Recharts `<BarChart>`.
- Stats sidebar: count, mean, median, p95, p99, stdev.

**Heatmap tab:**
- A grid: rows = runs (most recent at top, paginated), columns = tests within this module, cells colored by status. Hover cell → tooltip with the result preview.
- Built with SVG or a CSS grid + animated cells.

**Threshold tab:**
- For each numeric metric, a row: metric name, current value (live), threshold spec (op + typed value editor), action (warn/fail/notify), enabled toggle.
- Add new threshold button → inline form using shadcn `<Form>` primitives.

**Config tab:**
- The schema-driven form builder rendering this module's Config schema, in a read-only preview mode.
- Side panel: explanation of each field (from proto comments if available).

**Raw tab:**
- The decoded proto payload of the last result, rendered as a syntax-highlighted JSON tree (`<Collapsible>` per node).
- Toggle to show base64 source.

All tabs share the same module header. Tab switching animates content with `framer-motion` fade-slide.

### 5.3 New Run (`/runs/new`)

A stepper with motion-rich transitions between steps. Steps shown as a horizontal `<NavigationMenu>`-style progress at top.

**Step 1 — Identity:**
- Run name (`<Input>`), description (`<Textarea>`), tags (`<ToggleGroup>` for common tags + free-text add).

**Step 2 — Mode selection:**
- Four large mode cards in a 2×2 grid, each a clickable `<Card>` with:
  - Mode icon (large)
  - Mode name + one-line description
  - When-to-use bullet list
  - Required-config preview ("you'll set: frequency")
- Selected mode lifts and gains an animated outline (framer-motion `layoutId`).
- The four modes: Single-shot, Long-term, Monitoring, Event-based. No mixing.

**Step 3 — Module selection & configuration:**
- Three-column layout:
  - **Left** — module list (same grouping as sidebar). All modules disabled by default. Each row has a checkbox, name, status dot. Search at top. Bulk actions: enable all, enable category, clear.
  - **Center** — when at least one module is enabled, this shows a list of enabled modules with their per-module config inline (schema-driven form). Mode-aware fields appear at the top of each module's config card (frequency for long-term/monitoring, monitoring extras for monitoring, event condition for event-based).
  - **Right** — a live summary: count of enabled modules, estimated wall-clock duration (if computable), warnings (e.g., "monitoring extras require sensor X which is currently FAIL").
- Animated transitions when modules are toggled on/off (list reordering with `motion.li`).

**Step 4 — Review & launch:**
- A dense recap card with the full configuration.
- Action buttons: **Dry-run / Validate** (`<Button variant="secondary">`), **Save as Template** (`<Dialog>` for name/description), **Schedule for later** (`<Popover>` with `<Calendar>` and a cron input via `<Input>`), **Start Now** (primary, with a confirmation `<AlertDialog>`).

### 5.4 Run detail (`/runs/[runId]`)

The live operations center for a single run.

**Run header:**
- Run name + UUID short + a copy-to-clipboard icon button.
- Mode badge, status badge with severity, started/ended timestamps, elapsed.
- Action bar: cancel (when running), pause/resume (when mode supports), re-run, clone, export (CSV/JSON dropdown), generate report, tag, attach files, mark baseline, delete (with confirm).
- When live, header has a `motion.div` pulsing border.

**Two-pane main body:**
- **Left pane (40%)** — Per-module summary list. Each module enabled in the run as a row:
  - Module icon + name
  - Status badge (PASS / FAIL / ERROR / TIMEOUT / SKIPPED / ABORTED / NEVER / running with pulse)
  - Result count
  - Last result timestamp
  - Mini-sparkline of the primary metric across the run
  - Click → loads that module's results into the right pane
- **Right pane (60%)** — when a module is selected:
  - Top: a Recharts time-series chart for the selected module's results in this run. X = sequence or time, Y = metric. Multiple metrics chartable, each in a legend chip.
  - Below: virtualized table of results for this module within this run, with the same expand-to-detail pattern as the module page History tab.
- Both panes are `<Resizable>`.

**Live mode behavior:**
- New results animate in at the top of the right-pane table.
- Chart updates with `framer-motion` line draws (animate path length).
- The progress bar in the top bar shows fraction of expected results (if computable; if not, an indeterminate shimmer).

**Logs sidecar:**
- A toggleable `<Sheet>` from the right edge: logs from the run's time window, with live tail when run is active. Toggle button is a small log icon button next to the action bar.

### 5.5 Compare (`/runs/compare?a=&b=`)

Side-by-side per-module diff.

- Top: two run-pickers as `<Command>`-style search inputs. Each shows the chosen run as a card with badge.
- Body: a `<DataTable>` with rows per `(module_id, test_id)`. Columns:
  - Module · Test · Status A → Status B (badge transition with a small arrow) · Primary metric A → B (with delta % and arrow) · Category badge (`unchanged` / `improved` / `regressed` / `drifted` / `disappeared` / `appeared`).
- Top-of-table summary chips: counts per category, colored.
- Click a row → side `<Sheet>` showing the full diff for that test (both result detail views side by side).

### 5.6 Templates (`/templates`)

A grid (`<Card>` per template) or a `<DataTable>` toggle. Grid by default.

Each template card: name, mode badge, module count, last used, created by, action menu. Click → opens the New Run flow pre-filled.

### 5.7 Schedules (`/schedules`)

A `<DataTable>` of scheduled runs. Columns: name, template, cron expression (or one-time datetime), enabled toggle, last run (status + relative time), next run (countdown). Inline pause/resume via `<Switch>`. Click a row → side `<Sheet>` with execution history mini-timeline.

### 5.8 Logs (`/logs`)

A console-like view, monospace by default.

- Filter bar across the top: source chip group (kernel/syslog/app), severity chip group, time range (`<Popover>` with `<Calendar>`), free-text search (`<Input>`).
- Tail toggle (`<Switch>`).
- Main: a virtualized list of log lines, each line: timestamp · severity glyph · source · message (truncated, expand on click).
- Right sidebar: bookmarks list, saved views list, export button.
- Correlation: if a `result_id` query param is present, scroll to that timestamp and highlight a ±5s window with an animated ring.

### 5.9 Reports (`/reports`)

- Top: a `<Tabs>` with "Generate", "Templates", "Schedules".
- Generate tab: pick a run (`<Command>` search), pick a template, pick format (PDF/HTML radio cards), generate button → progress `<Sheet>`.
- Templates tab: list of report templates, editor for sections.
- Schedules tab: scheduled email reports.

### 5.10 OTA (`/ota`)

A heavily instrumented page — this is where the operator flashes the board.

- **Current versions card** at top: OS / HAL / Client versions in monospace with version numbers in a large display font.
- **Upload card**: a `<Dialog>` with a drop zone (drag-and-drop styled), file picker, progress bar during upload.
- **Verification card**: after upload, a step-by-step verification list (checksum, signature, manifest parse) with checkmarks animating in.
- **Diff card**: side-by-side current vs target versions, changelog (if available), risk flags.
- **Action card**: big primary button "Apply Upgrade", behind an `<AlertDialog>`. When live, a progress `<Sheet>` opens with detailed swupdate log streaming.
- **History table**: every prior upgrade with from → to, status, who, rollback button. Each rollback is itself a row with parent reference.

### 5.11 Settings (`/settings`)

A `<Tabs>` page with rich sections per Section 6 of the original web UI prompt (Account, Notifications, Data, Display, Network, Advanced). The Board tab is here too but **not for adding/removing the board** — the board exists by virtue of being connected. The Board tab shows the board ID, tags, rename, and OS/HAL/Client/Server/UI versions. The single "no board" state is handled by the top bar showing an "Offline" chip and the board strip showing "Disconnected" — not by hiding the sidebar or any feature.

### 5.12 Help (`/help`)

A documentation-style page with shadcn `<Card>` sections, in-app tooltips reference, keyboard shortcuts displayed in a `<Table>` with `<kbd>` styling, and a "what's new" changelog rendered from markdown.

### 5.13 Login (`/login`)

A focused single-card page. shadcn `<Card>` with the product wordmark, login form, framer-motion entrance, theme toggle in the corner. Background: a subtle animated gradient or noise.

---

## 6. Motion specification

Use `framer-motion` (now `motion/react`) for every transition. Specifics:

- **Page transitions** — fade + 8px y-translate on route change. 200ms ease-out.
- **Sidebar collapse/expand** — width animated with `layout`. 250ms `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Tab switches** — content fade-slide (12px x). 180ms.
- **List inserts/removes** — `<AnimatePresence>` with `motion.li`, slide-down-and-fade insertion, slide-up-and-fade removal.
- **Live result arrival** — `motion.div` flash: tiny scale bump (1 → 1.02 → 1) and ring color pulse (200ms).
- **Status badge change** — color cross-fade 200ms; if status worsens (PASS → FAIL), brief 1px ring pulse.
- **Number count-ups** — for KPI values, use `motion`'s `animate` with `useMotionValue` and `useTransform`. 600ms ease-out.
- **Chart line draws** — Recharts' built-in animation enabled; for live additions, animate the new segment's path length 400ms.
- **Hover lifts** — `whileHover={{ y: -2 }}` on cards, with `transition={{ type: "spring", stiffness: 400, damping: 30 }}`.
- **Pulse on live indicators** — looped opacity/scale animation, 1.5s cycle. Pause when `prefers-reduced-motion`.
- **Sheet/Drawer entrances** — shadcn's defaults are fine; verify they feel sharp (don't slow them down).
- **Skeleton shimmer** — use shadcn's `<Skeleton>` which already shimmers; ensure consistent shimmer speed across the app.

**`prefers-reduced-motion` honored everywhere.** No animation is required for state communication — color and shape carry the meaning; motion enhances.

---

## 7. Visual language

### Typography
- **Display font** — a modern geometric or technical sans (e.g., Geist, Inter Display, JetBrains Sans). Used for page titles, KPI values.
- **Body font** — same family, regular weight.
- **Monospace font** — JetBrains Mono or Geist Mono. Used for: board IDs, UUIDs, version numbers, log lines, metric values in tables, code-like data.
- Aggressive use of mono for technical data is part of the "instrument" feel.

### Color
- **Dark mode primary**: deep charcoal / near-black backgrounds (`hsl(220 13% 9%)` ish), elevated surfaces step lighter, with a subtle blue or green tint to taste. Accents in saturated cyan / signal-orange for live indicators.
- **Light mode**: warm-neutral backgrounds, but the design must hold up — no afterthought.
- **Status palette**:
  - PASS — emerald
  - FAIL — red
  - ERROR — deep crimson
  - TIMEOUT — amber
  - SKIPPED — gray
  - ABORTED — violet/purple
  - NEVER — hollow ring on muted
  - RUNNING — cyan with pulse
- **Severity overlay** — INFO no overlay, WARNING soft amber ring, ERROR red ring, CRITICAL thick red ring with subtle pulse.

All colors come from shadcn theme tokens. No hex literals in components.

### Iconography
- `lucide-react` everywhere. No mixing icon libraries.
- Module icons: pick deliberately per category. CPU → `<Cpu>`, Memory → `<MemoryStick>`, Storage → `<HardDrive>`, Network → `<Network>`, Sensors → `<Thermometer>` / `<Gauge>` / `<Wind>`, GPIO → `<Cable>`, etc.
- Status uses dot icons (`<Circle>`, `<CircleDot>`) or status-specific glyphs (`<CircleCheck>`, `<TriangleAlert>`, `<OctagonX>`, `<Hourglass>`).

### Spacing & density
- Default `gap-3` to `gap-4`; tighter than typical SaaS.
- Cards have 16–20px internal padding, not the default shadcn 24px in most places.
- Tables: row height ~36px, monospace for technical columns, normal sans for descriptive.

### Surfaces
- Use shadcn's `<Card>` with subtle borders. In dark mode, a 1px inner highlight via `box-shadow inset` adds the "physical" feel.
- For "instrument" panels (live tiles, vitals strip), add a subtle gradient overlay and a top-aligned glow on the active state.

---

## 8. Information architecture — single board, by ID only

- **No board picker anywhere in the UI.** The system connects to one board. The board's identity is surfaced as an ID chip in the top bar.
- **Boards are interchangeable.** Same SoC, same modules. Connecting a different board changes only the ID. The sidebar's module list is constant.
- **`modules.yaml` is the source of truth** for the module list and categories. The UI reads it (via the server's `/api/v1/modules`) and renders the sidebar.
- **"Add Board" is removed.** A board either is connected or it isn't; the top bar reflects state, but no UI flow exists to register a new board from the operator side. Pairing is handled by the agent/server during provisioning, out of UI scope.
- **Board removal is removed.** Same reasoning. The Settings → Board tab shows the connected board's ID, tags, and versions, with rename/tag as the only mutating actions.
- **Module list is unconditional.** Even when the board is offline, the sidebar shows the modules — with all module rows in a "Disconnected" state (muted, status dot hollow). This makes the layout stable and the hardware *visible* regardless of connectivity.

---

## 9. Live-data plumbing

This redesign leans heavily on live updates. Make sure the plumbing supports it.

- **SSE or polling** — confirm what the server offers at Phase 1. The board strip, the dashboard's KPI cards, the module sidebar's status dots, the run detail's results — all subscribe to live updates.
- **Single source per stream**, fanned out via TanStack Query cache. Do not open multiple SSE connections for the same data.
- **Optimistic UI** for low-risk mutations (rename, tag, note). Never for run launches or OTA.
- **Connection state visible** — when the SSE drops, the board strip shows "Reconnecting…" with a spinner. Reconnection logic exponential with jitter.

---

## 10. Component composition guidelines

- **Status badge** — one component (`<StatusBadge status severity size>`). Used everywhere status appears. No hand-rolled pills.
- **Module icon** — one component (`<ModuleIcon moduleId>`). Looks up the icon for a module's category.
- **Module row** — composable. Used in sidebar, dashboard tile grid, run detail per-module summary. Different sizes, same component.
- **Result detail** — the generic renderer is the only result presenter for the default case. Custom renderers via registry only.
- **Mini sparkline** — one component (`<Sparkline data />`), used in sidebar rows, dashboard tiles, and run detail per-module summary.
- **Live dot** — one component (`<LiveDot state />`) with states: `idle`, `running`, `pass`, `fail`, `error`, `timeout`, `skipped`, `aborted`, `never`, `disconnected`. Pulses for `running`.
- **KPI card** — one component (`<KpiCard title value delta sparkline icon />`).
- **Section card** — one component (`<SectionCard title actions>{children}</SectionCard>`) used as the dashboard region wrapper.

If you find yourself rebuilding similar JSX in three places, extract it.

---

## 11. Accessibility

- Keyboard navigable end-to-end. Every interactive element reachable via Tab, dismissible via Escape, activatable via Enter/Space.
- `<DropdownMenu>`, `<Dialog>`, `<Sheet>`, `<Popover>` — all shadcn primitives are accessible by default; do not break their props.
- `<StatusBadge>` includes an `aria-label` matching the status name.
- Color is never the sole carrier of meaning — every status badge also has an icon glyph and a text label (text optional in dense rows, but icon required).
- `prefers-reduced-motion` disables non-essential animations.
- Sufficient contrast in both light and dark modes; verify with a tool.

---

## 12. Performance

- **Virtualize** every list/table that can exceed ~100 rows (TanStack Virtual or TanStack Table's row virtualization).
- **Memoize** heavy chart inputs. Recharts re-renders are expensive.
- **Avoid layout thrash** during live updates: use `motion.div` with explicit `transform` over `top/left` changes.
- **Code-split** routes via App Router; the Dashboard and Module page are the heaviest and benefit most.
- **Image-free** is fine — this is an instrument, not a marketing site. No hero images.
- Production `next build` produces a small first-load bundle. Verify and document.

---

## 13. Required project changes

### Directory delta (under `webui/src/`)

```
components/
  layout/
    top-bar.tsx                # NEW — replaces nav-sidebar
    board-strip.tsx            # NEW — vitals row under top bar
    sidebar-modules.tsx        # KEEP, redesigned per §3.2
    command-palette.tsx        # NEW — ⌘K
    user-menu.tsx              # KEEP
  primitives/
    status-badge.tsx           # KEEP, redesigned
    live-dot.tsx               # NEW
    module-icon.tsx            # NEW
    sparkline.tsx              # NEW
    kpi-card.tsx               # NEW
    section-card.tsx           # NEW
    count-up.tsx               # NEW — animated number
    pulse-ring.tsx             # NEW — re-usable live indicator
  dashboard/                   # NEW directory for §5.1 regions
    kpi-row.tsx
    live-module-grid.tsx
    live-results-stream.tsx
    recent-failures-feed.tsx
    pinned-runs-carousel.tsx
    run-history-table.tsx
  modules/
    module-header.tsx
    module-tabs/
      overview.tsx
      history.tsx
      trend.tsx
      distribution.tsx
      heatmap.tsx
      threshold.tsx
      config.tsx
      raw.tsx
  runs/
    new-run-stepper/
      step-identity.tsx
      step-mode.tsx
      step-modules.tsx
      step-review.tsx
    run-header.tsx
    per-module-summary-list.tsx
    run-results-pane.tsx
    logs-sidecar.tsx
  motion/
    presets.ts                 # animation timings + easings exported once
```

### Theme & tokens
- Update `tailwind.config.ts` with the status color tokens and any custom shadows / gradients.
- Update `globals.css` for theme tokens (light + dark).

### Routing
- Top-level routes unchanged. The layout component swaps from sidebar-primary to top-bar-primary; the sidebar stays but is now hardware-only.

### Existing pages to redesign
- `/` Dashboard — full redesign per §5.1.
- `/modules/[moduleId]` — full redesign per §5.2.
- `/runs` — table redesign with rich columns + filters.
- `/runs/new` — stepper redesign per §5.3.
- `/runs/[runId]` — full redesign per §5.4.
- `/runs/compare` — full redesign per §5.5.
- `/templates`, `/schedules`, `/logs`, `/reports`, `/ota`, `/settings`, `/help`, `/login` — redesigns per §5.6–§5.13.

---

## 14. Workflow — phases

Long-running task. No human gates. Write each phase report under `webui_redesign/`.

### Phase 1 — Discovery & design system
1. Locate the existing Web UI. Inventory the pages, components, and shadcn primitives already in use.
2. Read `protos/registry/modules.yaml` (or the server's `/api/v1/modules`) to get the actual module list and categories.
3. Verify shadcn is at a current version. List installed primitives. Identify any from §4 that aren't yet added — they will be added in Phase 2.
4. Confirm motion library: install `motion/react` (or `framer-motion`) if not already present.
5. Confirm theming approach (CSS variables via shadcn). Identify gaps for status color tokens.
6. Produce a design token plan: colors per status × severity in dark and light, spacing scale, typography stack, shadow stack.

Write `webui_redesign/01_discovery.md`.

### Phase 2 — Foundation
1. Install missing shadcn primitives (`Sidebar`, `Resizable`, `Carousel`, `Command`, etc.).
2. Install motion library.
3. Update `tailwind.config.ts` with status tokens, typography stack (Geist or chosen alternative), shadow utilities for "instrument" surfaces.
4. Build the shared primitives in `components/primitives/` (§10): `StatusBadge`, `LiveDot`, `ModuleIcon`, `Sparkline`, `KpiCard`, `SectionCard`, `CountUp`, `PulseRing`.
5. Build `components/motion/presets.ts` with the animation timings from §6.
6. Smoke tests for each primitive (render, prop variants).

Write `webui_redesign/02_foundation.md`.

### Phase 3 — Layout shell
1. Build `top-bar.tsx`, `board-strip.tsx`, redesigned `sidebar-modules.tsx`, `command-palette.tsx`.
2. Wire them into the root layout. Replace the existing layout.
3. Implement the ⌘K palette with destinations + a quick "Run something" command.
4. Implement the sidebar's grouped accordion, search, status dots, sparklines, hover cards, run-state card at the bottom.
5. Verify the persistent board strip subscribes to live data (or polls) without leaking subscriptions across navigation.
6. Test: keyboard nav across top bar and sidebar; collapsed sidebar usability; theme toggle; ⌘K open/close.

Write `webui_redesign/03_shell.md`.

### Phase 4 — Dashboard
1. Build all dashboard regions per §5.1.
2. Wire KPI cards to real server data via TanStack Query.
3. Implement the live module grid with TanStack Query subscriptions per tile or a single shared stream fanned out.
4. Implement the live results stream with virtualization and animated insertion.
5. Implement the recent failures feed.
6. Implement the pinned runs carousel.
7. Implement the run history table.
8. Verify smooth performance with 50 modules and a live stream at 10 results/sec.

Write `webui_redesign/04_dashboard.md`.

### Phase 5 — Module page
1. Build the module header.
2. Build each tab per §5.2.
3. Implement the Trend tab's multi-line chart with axis switching.
4. Implement the Distribution tab.
5. Implement the Heatmap tab.
6. Implement the Threshold tab with the typed-value editor.
7. Implement the Raw tab (proto-decoded JSON tree).
8. Test across multiple modules of different categories.

Write `webui_redesign/05_module_page.md`.

### Phase 6 — New Run + Run Detail + Compare
1. Build the New Run stepper per §5.3 with framer-motion step transitions.
2. Build the Run Detail two-pane layout per §5.4.
3. Build the live results streaming behavior with smooth animated insertion and chart updates.
4. Build the logs sidecar `<Sheet>`.
5. Build the Compare page per §5.5.
6. E2E test: launch a run → see live updates → cancel → mark baseline → compare to another run.

Write `webui_redesign/06_runs.md`.

### Phase 7 — Templates, Schedules, Logs, Reports, OTA, Settings, Help, Login
1. Redesign each page per §5.6–§5.13.
2. The OTA page especially gets the full instrument treatment.
3. Settings keeps its tabs but is restyled.
4. Login is a focused single-card page with motion.

Write `webui_redesign/07_secondary_pages.md`.

### Phase 8 — Motion & polish pass
1. Apply animation presets from `motion/presets.ts` consistently across every page.
2. Verify `prefers-reduced-motion` disables non-essential animations.
3. Verify every interactive element has a hover and focus state.
4. Add micro-interactions where they earn their keep (count-ups, badge cross-fades, list inserts).
5. Audit for animation overuse — anything purely decorative gets removed.

Write `webui_redesign/08_motion.md`.

### Phase 9 — Accessibility & performance
1. Keyboard nav audit (every page).
2. Screen-reader pass on `StatusBadge`, sidebar, top bar, dialogs, sheets.
3. Contrast audit in both modes.
4. Performance: virtualization in place where required; chart memoization; bundle size check.
5. Lighthouse / Core Web Vitals against a production build.

Write `webui_redesign/09_a11y_perf.md`.

### Phase 10 — Final verification & deliverables
1. `next build` clean.
2. `tsc --noEmit` clean.
3. Unit and E2E tests green.
4. Run the system end-to-end against the real server: connect to a board, launch a single-shot run, watch live, drill into a module, set a threshold, mark baseline, compare to a prior run, trigger an OTA dry-run (mocked), check logs correlation. Capture evidence (screenshots + short screen recordings) under `webui_redesign/evidence/`.
5. Write the final report.

Write `webui_redesign/10_final_report.md`.

---

## 15. Hard rules

- **The sidebar shows hardware modules unconditionally.** No empty state, no "add board" flow gates it.
- **No board picker anywhere.** Board surfaced only as an ID chip in the top bar.
- **Boards are interchangeable.** Same hardware. Only the ID differs.
- **Top nav is the app-level navigation. Sidebar is hardware-only.** Don't blur this.
- **Use shadcn primitives.** If shadcn has it, use it. No reinventing.
- **One canonical `<StatusBadge>`, `<LiveDot>`, `<ModuleIcon>`, `<Sparkline>`, `<KpiCard>`, `<SectionCard>`.** No duplicates.
- **No `switch(module_id)`** outside the renderer registry.
- **Motion has meaning.** No decorative-only animation. Respect `prefers-reduced-motion`.
- **No hex literals in components.** Theme tokens only.
- **Dark mode is the design target.** Light mode is fully supported but not the primary aesthetic.
- **Persistent board strip + top bar visible on every page** except login.
- **No localStorage / sessionStorage** for application data. TanStack Query cache + cookies for auth.
- **No new heavyweight dependencies** beyond shadcn primitives, Recharts, motion, TanStack libraries, lucide.
- **Component density over whitespace.** This is a dashboard, not a marketing site.
- **shadcn `<Sidebar>` primitive** is the foundation for §3.2 — don't roll your own sidebar shell.

---

## 16. Deliverables

At Phase 10 completion:
- Production build passes (`next build`).
- `tsc --noEmit` clean.
- All unit + E2E tests green.
- Every page redesigned per §5.
- Every primitive in §10 implemented and used consistently.
- Motion system applied with `prefers-reduced-motion` respected.
- Accessibility audit passed (keyboard, contrast, screen reader).
- Performance audit passed (virtualization, memoization, bundle size documented).
- A short demo recording (≤2 min) walking the dashboard, a live run, a module deep-dive, a compare, captured under `webui_redesign/evidence/`.
- README updated: how to run, theme tokens reference, design principles summary, where to add a new module icon, where to add a custom result renderer.
- All phase reports under `webui_redesign/01_…` through `webui_redesign/10_final_report.md`.

Begin with Phase 1.