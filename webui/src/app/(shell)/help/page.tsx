"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useConnectionStore } from "@/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pageVariants } from "@/components/motion/presets";
import { cn } from "@/lib/utils";
import {
  BookOpen, Keyboard, Megaphone, FlaskConical, ChevronRight,
  LayoutDashboard, Terminal, Play,
} from "lucide-react";

// ─── Keyboard shortcuts ────────────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Open command palette" },
  { keys: ["G", "R"], action: "Go to Runs" },
  { keys: ["G", "M"], action: "Go to Modules" },
  { keys: ["G", "L"], action: "Go to Logs" },
  { keys: ["G", "S"], action: "Go to Settings" },
  { keys: ["G", "H"], action: "Go to Help" },
  { keys: ["N", "R"], action: "New Run" },
  { keys: ["Esc"], action: "Close modal / dismiss" },
  { keys: ["?"], action: "Show shortcuts" },
];

// ─── Docs sections ────────────────────────────────────────────────────────────

const DOCS = [
  {
    title: "Getting Started",
    icon: LayoutDashboard,
    items: [
      { title: "What is Acadia IV&V?", body: "Acadia is an Independent Validation & Verification dashboard for hardware test boards. Connect to a board, run tests across hardware modules, and analyse results in real time." },
      { title: "Board Connection", body: "Configure the board API URL in Settings → Network. If no hardware is available, use Simulated Mode for a fully synthetic demo environment." },
      { title: "First Run", body: "Navigate to Runs → New Run. Select a test mode, choose modules, and click Start Run. Results stream live to the Run Detail page." },
    ],
  },
  {
    title: "Test Modes",
    icon: Play,
    items: [
      { title: "Single Shot", body: "Runs each selected module test once and returns results. Best for quick regression checks." },
      { title: "Long Term", body: "Repeats tests at a configured frequency. Results are streamed live and plotted on trend charts." },
      { title: "Monitoring", body: "Passive observation mode — tests run continuously but assertions are relaxed. Useful for burn-in scenarios." },
      { title: "Event Based", body: "Results are emitted only when a hardware condition trips. Configure event sources in the board config." },
    ],
  },
  {
    title: "Modules",
    icon: Terminal,
    items: [
      { title: "Module Catalog", body: "All 51 hardware modules are always visible in the sidebar and Module page, regardless of connection state." },
      { title: "Module Detail", body: "Each module has 8 tabs: Overview, History, Trend, Distribution, Heatmap, Thresholds, Config, and Raw JSON. In Simulated Mode a Simulate tab lets you pin statuses and inject faults." },
      { title: "Metrics", body: "Numeric metrics from test results are plotted in Trend and Distribution charts. Set pass/fail thresholds in the Thresholds tab." },
    ],
  },
  {
    title: "Reports & Schedules",
    icon: BookOpen,
    items: [
      { title: "Generating Reports", body: "Go to Reports → Generate. Select a completed run and choose PDF, CSV, or JSON format." },
      { title: "Scheduled Reports", body: "Create cron-based report schedules in Reports → Schedules. Reports are emailed or stored on-board." },
    ],
  },
];

// ─── Changelog ────────────────────────────────────────────────────────────────

const CHANGELOG = [
  { version: "2.0.0", date: "2025-06", headline: "Proto-Driven Redesign", notes: ["All 51 hardware modules from HAL proto catalog", "Simulated mode — full synthetic data, no hardware needed", "New Run page: RadioGroup mode selector", "Module detail: 8-tab layout with Trend, Distribution, Heatmap"] },
  { version: "1.4.0", date: "2025-03", headline: "Motion + Polish", notes: ["Framer Motion page transitions", "KPI cards with count-up animations", "Board vitals strip in sidebar"] },
  { version: "1.3.0", date: "2025-01", headline: "OTA Upgrades", notes: ["Firmware upload with drag-and-drop", "Verification pipeline (checksum, signature, manifest)", "History table with rollback"] },
  { version: "1.2.0", date: "2024-11", headline: "Reports", notes: ["PDF / CSV / JSON report generation", "Scheduled reports via cron"] },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const router = useRouter();
  const setSimulated = useConnectionStore((s) => s.setSimulated);
  const [expandedDoc, setExpandedDoc] = React.useState<string | null>(null);

  function startTour() {
    setSimulated();
    router.push("/");
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Help &amp; Documentation</h1>
          <p className="text-sm text-muted-foreground">Guides, keyboard shortcuts, and release notes</p>
        </div>

        {/* Tour CTA */}
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5 flex items-start gap-4">
          <FlaskConical className="h-8 w-8 text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Tour the UI in Simulated Mode</div>
            <p className="text-xs text-muted-foreground mt-1">Explore every feature without connecting to hardware. Synthetic data flows through all pages — runs, modules, logs, OTA, and reports.</p>
          </div>
          <Button size="sm" onClick={startTour} className="shrink-0 gap-1.5 bg-purple-600 hover:bg-purple-500 text-white border-none">
            <FlaskConical className="h-3.5 w-3.5" /> Start Tour
          </Button>
        </div>

        {/* Documentation */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Documentation
          </h2>
          {DOCS.map(({ title, icon: Icon, items }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <button type="button"
                onClick={() => setExpandedDoc((v) => v === title ? null : title)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm flex-1">{title}</span>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedDoc === title && "rotate-90")} />
              </button>
              {expandedDoc === title && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/40">
                  {items.map(({ title: t, body }) => (
                    <div key={t} className="pt-3">
                      <div className="text-xs font-semibold">{t}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5" /> Keyboard Shortcuts
          </h2>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Keys</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map(({ keys, action }) => (
                  <tr key={action} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        {keys.map((k, i) => (
                          <React.Fragment key={i}>
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-sm">{k}</kbd>
                            {i < keys.length - 1 && <span className="text-muted-foreground">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* What's New */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" /> What&apos;s New
          </h2>
          <div className="space-y-4">
            {CHANGELOG.map(({ version, date, headline, notes }, i) => (
              <div key={version} className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                  {i < CHANGELOG.length - 1 && <div className="flex-1 w-px bg-border/60 min-h-4" />}
                </div>
                <div className="pb-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={i === 0 ? "default" : "secondary"} className="text-[10px] h-4 px-1.5 font-mono">v{version}</Badge>
                    <span className="text-[10px] text-muted-foreground">{date}</span>
                    <span className="text-xs font-semibold">{headline}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {notes.map((n) => (
                      <li key={n} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
