# Web UI App Generation Prompt

You are building the **Web UI App** for an Independent Validation & Verification (IV&V) tool suite. This is one of five components in the system. Read this entire document before writing any code. Stop at the checkpoints. Do not improvise architectural decisions that are already made below.

---

## 1. System context (read first, do not skip)

The full suite has five components. You are only building #5.

1. **Yocto OS** — runs on Raspberry Pi targets, supports OTA. Already done.
2. **HAL** — C++ library on the target. 50+ modules (CPU, memory, peripherals, sensors, etc.). Supports four execution modes. Already done.
3. **Client App** — C++ app on the target. Talks gRPC to the Server App.
4. **Server App** — Python app on x86 server. gRPC for clients, REST + OpenAPI for this Web UI. Postgres-backed.
5. **Web UI App** — *what you are building*. Operator-facing dashboard. Talks REST to the Server App.

The Web UI is the only user-facing surface in the entire system. Everything an operator does — onboarding targets, defining test configurations, launching runs, watching results stream in, browsing historical data, tailing logs — happens here.

---

## 2. What the Web UI must do

1. **Target inventory** — show all known targets (Raspberry Pi boards/SoMs), their online/offline state, last-seen time, hardware model, OS/OTA version, and the HAL module inventory each target reports.
2. **Module catalog** — show all HAL modules known to the server (loaded from the server's module registry). 50+ modules. Each has its own Config schema and Result schema.
3. **Test configuration builder** — operator picks a module, picks one of four execution modes (single-shot, long-term, monitoring, event-based), fills in the module-specific parameters, fills in the mode-specific parameters (frequency, duration, monitoring extras, event conditions). Saves as a reusable named configuration.
4. **Run launcher** — operator selects a saved configuration and one or more targets, launches a run. The UI tracks run state (queued → running → completed/failed/cancelled), supports cancellation.
5. **Live results view** — for an active run, results stream in. Mode-dependent: single-shot shows one result; long-term/monitoring/event-based show a growing stream. Render mode-appropriate visualizations (table, time-series chart, event log).
6. **Historical results browser** — query past results by target, module, time range, status. Paginated. Per-result detail view that decodes the module-specific payload.
7. **Logs viewer** — browse and tail kernel/syslog/app logs per target. Filter by severity, source, time range. Export to file.
8. **Run history** — list of all runs with status, target, config, duration, result count.

Out of scope:
- Authoring or modifying HAL modules.
- Direct gRPC to targets (the UI never talks to targets — only to the Server App).
- OTA management.
- Server-side admin (DB migrations, etc.).

---

## 3. The central technical challenge — read carefully

The Server App exposes 50+ HAL modules, **each with its own protobuf-defined Config and Result message**. New modules can be added without redeploying the UI; deprecated modules must remain renderable so historical data stays viewable.

This means **the UI cannot hand-write a form component per module and a result renderer per module**. That path doesn't scale to 50+ modules and breaks the day a module is added.

The correct architecture is **schema-driven rendering**:

- At build time (or fetched at runtime), the UI consumes a machine-readable description of every module's Config and Result schema — generated from the proto files.
- A generic form-builder component renders the Config form from that schema.
- A generic result renderer renders the Result from that schema, with module-specific visualization hints (chart vs. table vs. gauge) sourced from registry metadata or convention.
- Custom renderers are allowed as **overrides** for specific modules where the generic view is insufficient, but the default path is always the generic schema-driven one.

The Server App's `/api/v1/modules` endpoint returns the module registry. The UI relies on this as the source of truth for what modules exist, not on hardcoded knowledge.

For the binary `payload` inside a `ResultEnvelope`: the server returns it as base64 bytes plus a `type_url`. The UI decodes it on the client side using generated TypeScript types from the protos. (Alternative the server can do server-side decode and return JSON; this should be confirmed at Checkpoint A based on what the server actually offers.)

---

## 4. Architectural decisions already made — do not relitigate

- **Framework**: Next.js 14+ with the App Router. TypeScript strict mode.
- **UI library**: shadcn/ui. Tailwind CSS. lucide-react for icons.
- **State management**: TanStack Query (React Query) for all server state. Zustand only if genuinely needed for cross-component client state; otherwise component-local `useState`. Do not introduce Redux.
- **Forms**: react-hook-form + zod for validation. The schema-driven form builder generates zod schemas dynamically from module metadata.
- **Tables**: TanStack Table. Server-side pagination, sorting, filtering — never client-side for result/log tables.
- **Charts**: Recharts for time-series and basic charting. If something more advanced is needed for a specific module (heatmaps, etc.), that module gets a custom renderer.
- **Streaming/live updates**: Server-Sent Events (SSE) preferred for tailing results and logs. If the Server App exposes only polling, fall back to TanStack Query's `refetchInterval`. Decide based on what the server actually offers at Checkpoint A.
- **Proto consumption**: generate TypeScript types from the existing `protos/` directory using `ts-proto` or `protobuf-ts`. Pick one at Checkpoint A; do not mix.
- **API client**: a thin typed client over `fetch`. If the server publishes an OpenAPI spec (it does — FastAPI auto-generates one), generate the client from it with `openapi-typescript` + `openapi-fetch`. Do not hand-write the client.
- **Routing**: App Router conventions. Server Components for shells and data-loading where possible, Client Components for anything interactive.
- **Dark mode**: supported via `next-themes`. Default to system.
- **No global CSS beyond Tailwind base and shadcn theme tokens.**

---

## 5. Required project layout

```
webui/
  package.json
  tsconfig.json
  next.config.mjs
  tailwind.config.ts
  components.json                # shadcn config
  .env.example
  README.md
  src/
    app/
      layout.tsx                 # root layout, theme provider, query provider
      page.tsx                   # dashboard home
      targets/
        page.tsx                 # target list
        [targetId]/
          page.tsx               # target detail
      modules/
        page.tsx                 # module catalog
        [moduleId]/
          page.tsx               # module detail (schema preview, recent results)
      configs/
        page.tsx                 # saved configurations list
        new/page.tsx             # config builder
        [configId]/
          page.tsx               # config detail / edit
      runs/
        page.tsx                 # run history
        [runId]/
          page.tsx               # live + final run view
      logs/
        page.tsx                 # log explorer
      api/                       # only if BFF endpoints are needed; prefer direct calls to Server App
    components/
      ui/                        # shadcn primitives (generated)
      layout/
        app-shell.tsx
        sidebar.tsx
        topbar.tsx
      targets/
      configs/
        config-builder.tsx       # mode selector + module selector + dynamic form
        mode-fields/
          single-shot.tsx
          long-term.tsx
          monitoring.tsx
          event-based.tsx
      runs/
        run-status-badge.tsx
        run-launcher.tsx
      results/
        result-stream.tsx        # live streaming view
        result-table.tsx
        result-detail.tsx
        renderers/
          generic.tsx            # the default schema-driven renderer
          registry.ts            # module_id -> custom renderer mapping (initially empty)
      logs/
        log-viewer.tsx
        log-tail.tsx
      form-builder/
        index.tsx                # schema-driven form generator
        field-renderers/         # one per proto field type (string, int, enum, message, …)
        zod-from-schema.ts       # builds zod schema from module schema
    lib/
      api/
        client.ts                # generated openapi client wrapper
        queries.ts               # TanStack Query hooks
        sse.ts                   # SSE helpers if used
      proto/
        generated/               # ts-proto output, gitignored, regenerated
        decode.ts                # decode Any payloads via type_url
        registry.ts              # client-side mirror of server module registry
      schema/
        module-schema.ts         # types describing a module's config/result schema
        proto-to-schema.ts       # converts proto descriptors to UI schema
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
    e2e/                         # Playwright
```

If the existing repo already has a different convention, adapt and explain — do not silently restructure.

---

## 6. The schema-driven form builder — design notes

This is the most architecturally important component in the app. Build it carefully.

Inputs:
- A module schema (per module, derived from the proto). Includes field name, field type (scalar, message, enum, repeated, oneof), constraints (range, required, default), and human-friendly labels/descriptions if available in proto comments.

Outputs:
- A rendered form using shadcn primitives (`Input`, `Select`, `Switch`, `Slider`, `NumberInput`, etc.).
- A live zod schema for validation.
- On submit, an object that serializes cleanly into the proto-shaped JSON the server expects.

Field-type mapping:
- `string` → `Input`
- `int32`/`int64`/`uint32`/`uint64` → numeric `Input` with constraints
- `float`/`double` → numeric `Input`
- `bool` → `Switch`
- `enum` → `Select`
- `repeated <scalar>` → multi-value chip input or repeatable rows
- `message` → nested fieldset (recurse)
- `oneof` → tab group or `Select` switching between variant subforms
- `bytes` → file upload or base64 text (rare in HAL configs; flag if encountered)
- `google.protobuf.Timestamp` → date-time picker
- `google.protobuf.Duration` → duration input
- `google.protobuf.Any` → not directly editable in a generic form; require a custom renderer registered for the wrapping module

Mode-specific fields (frequency, duration, event condition) are NOT part of the module schema — they come from `common.proto` and live in dedicated `mode-fields/` components. The full config form composes: `[mode fields based on selected mode] + [module-specific fields from the module schema]`.

Provide a clear extension point so a future engineer can drop a custom field renderer for a specific (module, field) pair without forking the form builder.

---

## 7. Pages and flows — minimum scope

### Dashboard (`/`)
- Online/offline target count
- Active runs count + quick links
- Recent results sparkline
- System health badge (server reachable / DB reachable from `/api/v1/health/ready`)

### Targets (`/targets`, `/targets/[id]`)
- List: hostname, model, OS version, status, last seen, action menu
- Detail: header card, HAL module inventory, recent runs, recent logs tail (last 100 lines)

### Modules (`/modules`, `/modules/[id]`)
- List: name, version, status (active/deprecated), short description
- Detail: schema preview (rendered as a read-only form), recent results across all targets

### Configs (`/configs`, `/configs/new`, `/configs/[id]`)
- List: name, module, mode, created date, action menu
- Builder:
  1. Pick a module (searchable combobox over 50+ items)
  2. Pick a mode (4 radio cards with descriptions)
  3. Fill mode-specific fields
  4. Fill module-specific fields (schema-driven)
  5. Name the config, save
- Detail/edit: same builder pre-filled

### Runs (`/runs`, `/runs/[id]`)
- List: id, config, target(s), mode, status, started, duration, result count
- Launcher modal: pick saved config → pick target(s) → confirm → POST `/api/v1/runs`
- Detail: status header with cancel button, live result stream (mode-appropriate), final summary on completion. Mode-appropriate view:
  - single-shot: one result card with payload-decoded fields
  - long-term/monitoring: time-series chart + table, both updating live
  - event-based: event log with each callback as a row

### Logs (`/logs`)
- Filters: target, source (kernel/syslog/app), severity, time range, free-text search
- Virtualized scrolling table
- Tail mode toggle (live updates via SSE or polling)
- Export button

---

## 8. Operational requirements

- **Loading states**: every async view has skeleton loaders. No spinners-on-blank-screen.
- **Empty states**: every list has a designed empty state with a clear next action.
- **Error states**: every failed query shows a recoverable error with retry. Network errors are distinguished from server errors.
- **Optimistic updates**: only for low-risk mutations (config rename, etc.). Never for run launches.
- **Pagination**: server-side, cursor-based if the server supports it, offset-based otherwise. Default page size 50.
- **Accessibility**: keyboard-navigable everywhere. Focus rings respected. shadcn primitives already get most of this right — don't break them.
- **Responsive**: usable on a laptop (primary) and a tablet (secondary). Phone is not a target.
- **Performance**: result tables and log tables must use windowing/virtualization. A 10k-row result page must not jank.
- **Configuration**: server URL via `NEXT_PUBLIC_API_BASE_URL`. Provide `.env.example`.
- **Auth**: assume an API key passed via header for now. Read from env or from a simple sign-in screen that stores it in an httpOnly cookie via a Next.js route handler. Do not invent a full auth system.

---

## 9. Testing requirements

- **Unit tests** (Vitest + React Testing Library) for the form builder, the schema-to-zod converter, the payload decoder, and each non-trivial component.
- **E2E tests** (Playwright) for the critical flows: create config → launch run → see results; tail logs; browse historical results. Run against a mocked server (msw or Playwright's request mocking).
- Target coverage: 70%+ on `src/` excluding generated code.

---

## 10. Workflow — execute in this exact order, stop at each checkpoint

### Checkpoint A — Scan and plan
Before writing any code:
1. Locate the Server App. Read its OpenAPI spec (typically `/openapi.json` or by reading the FastAPI router source). List every endpoint, request shape, response shape.
2. Locate the `protos/` directory. List every `.proto` file. Read `common.proto`, `hal_service.proto`, and the `modules/` files. Read `registry/modules.yaml`.
3. Decide: ts-proto vs protobuf-ts. Justify briefly.
4. Decide: server-side payload decoding vs. client-side. Confirm what the server actually returns for results — JSON-decoded or base64+type_url. If unclear, ask.
5. Decide: SSE vs. polling for live updates. Confirm what the server supports.
6. Produce a written plan: routes, components, data flow per page, what's a Server Component vs. Client Component.
7. List every ambiguity.

**STOP. Wait for my confirmation.**

### Checkpoint B — Skeleton, theming, generated types, API client
1. Set up Next.js, TypeScript, Tailwind, shadcn baseline (theme, layout primitives).
2. App shell: sidebar, topbar, theme toggle, route placeholders for all pages from Section 7.
3. `scripts/generate-proto-types.sh` produces TS types from `protos/`.
4. `scripts/generate-api-client.sh` produces a typed client from the server's OpenAPI.
5. TanStack Query provider, error boundary, global toast (`sonner` via shadcn).
6. Dashboard page with health check wired up end-to-end.

Run lint + typecheck + unit tests. **STOP.**

### Checkpoint C — Targets, modules, the form builder
1. Targets list + detail pages, wired to real REST endpoints.
2. Modules list + detail pages.
3. The schema-driven form builder, with unit tests for every field-type mapping.
4. Module detail page renders the schema as a read-only form preview using the builder.

Run tests. **STOP.**

### Checkpoint D — Configs and runs
1. Config builder page composing mode fields + schema-driven module fields.
2. Configs list + detail.
3. Run launcher modal.
4. Run list page.
5. Run detail page with live streaming view per mode. Payload decoding via the proto registry.
6. Result rendering: generic renderer first; renderer registry with one placeholder override to prove the pattern.
7. Run cancellation.

Run tests including E2E for the create-config → launch-run → see-result flow. **STOP.**

### Checkpoint E — Logs, polish, ops
1. Logs viewer with filters, virtualized table, tail mode.
2. Log export.
3. Empty/loading/error states audited across all pages.
4. Accessibility pass: keyboard nav, focus, contrast.
5. Performance pass: virtualization verified on 10k rows.
6. README: how to run, env vars, how to add a custom result renderer for a module, how to regenerate types when protos change.
7. Production build verified. Docker image multi-stage, non-root.

Final test run. Final report.

---

## 11. Hard rules

- The UI talks to the Server App only via the documented REST API. Never directly to a target. Never to the database.
- Do not hardcode a module's name, schema, or field list anywhere. Everything module-aware reads from the server's module registry.
- Do not hand-write a form per module. The form builder is the only path. Custom renderers are overrides on top of generic rendering, not replacements.
- Do not commit generated proto types or generated API client code as authoritative source. They're build output.
- Do not introduce a new state management library beyond what Section 4 allows.
- Do not ship features that aren't in Section 7 without raising them first.
- If the server's actual API contradicts this prompt, the server wins — stop and report the gap, do not paper over it.
- If you find yourself writing a switch over `module_id` outside of the renderer registry, stop and ask.
- Do not break shadcn's accessibility defaults by replacing primitives with custom divs.

## 12. Deliverables

At the end of Checkpoint E:
- A working Web UI runnable via `npm run dev` against a running Server App.
- Production-ready `next build` succeeds.
- Dockerfile producing a small runnable image.
- Passing test suite with reported coverage.
- README sufficient for a new developer to be productive in under an hour, including the "how to add a custom renderer" and "how to regenerate proto types" workflows.
- An "Ambiguities resolved" log: every decision made during ambiguity, with rationale.

Begin with Checkpoint A.