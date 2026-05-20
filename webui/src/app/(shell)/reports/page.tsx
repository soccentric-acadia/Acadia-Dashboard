"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useRuns, useTemplates, useSchedules } from "@/data";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { pageVariants } from "@/components/motion/presets";
import { FileText, Download, Clock, CalendarClock, FileDown, Layers, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { Run, Status } from "@/lib/api/types";
import type { Template, Schedule } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF", description: "Formatted report with charts", icon: FileText },
  { value: "csv", label: "CSV", description: "Raw tabular data", icon: Table2 },
  { value: "json", label: "JSON", description: "Full structured data export", icon: Layers },
];

function GenerateTab() {
  const { data: runsData, isLoading } = useRuns() as { data: { runs: Run[] } | undefined; isLoading: boolean };
  const runs = (runsData?.runs ?? []).filter((r) => r.status === "completed");
  const [selectedRun, setSelectedRun] = React.useState("");
  const [format, setFormat] = React.useState("pdf");
  const [generating, setGenerating] = React.useState(false);

  async function handleGenerate() {
    if (!selectedRun) { toast.error("Select a run"); return; }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
    toast.success(`${format.toUpperCase()} report queued for run ${selectedRun.slice(0, 8)}…`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <SectionCard title="Select Run">
          <div className="space-y-2">
            {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded" />)}
            {!isLoading && runs.length === 0 && <p className="text-xs text-muted-foreground">No completed runs available.</p>}
            <ScrollArea className="h-48">
              <div className="space-y-1 pr-1">
                {runs.map((r) => (
                  <button key={r.id} type="button"
                    onClick={() => setSelectedRun(r.id)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-accent/50",
                      selectedRun === r.id ? "bg-primary/10 border border-primary/30" : "border border-transparent")}
                  >
                    <StatusBadge status={(r.status as Status) ?? "pass"} className="shrink-0" />
                    <span className="flex-1 truncate font-mono">{r.name || r.id}</span>
                    <span className="text-muted-foreground shrink-0">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SectionCard>

        <SectionCard title="Output Format">
          <RadioGroup value={format} onValueChange={setFormat} className="space-y-2">
            {FORMAT_OPTIONS.map(({ value, label, description, icon: Icon }) => (
              <label key={value} htmlFor={`fmt-${value}`}
                className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary/60",
                  format === value ? "border-primary bg-primary/5" : "border-border")}
              >
                <RadioGroupItem value={value} id={`fmt-${value}`} className="shrink-0" />
                <Icon className={cn("h-4 w-4 shrink-0", format === value ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{description}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </SectionCard>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 sticky top-4 h-fit">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate Report</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Run</span><span className="font-mono">{selectedRun ? selectedRun.slice(0, 12) + "…" : <em className="text-muted-foreground/50">none</em>}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Format</span><Badge variant="outline" className="text-[9px] h-4 px-1">{format.toUpperCase()}</Badge></div>
        </div>
        <Separator />
        <Button className="w-full gap-2" disabled={!selectedRun || generating} onClick={handleGenerate}>
          <FileDown className="h-4 w-4" />{generating ? "Generating…" : "Generate & Download"}
        </Button>
      </div>
    </div>
  );
}

function TemplatesTab() {
  const { data: templates = [], isLoading } = useTemplates() as { data: Template[]; isLoading: boolean };
  return (
    <div className="space-y-3">
      {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">No report templates. Create a run configuration first.</div>
      )}
      {templates.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.description}</div>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono shrink-0">{t.mode.replace(/_/g, " ")}</Badge>
          <Button size="sm" variant="outline" className="shrink-0 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" /> Use
          </Button>
        </div>
      ))}
    </div>
  );
}

function SchedulesTab() {
  const { data: schedules = [], isLoading } = useSchedules() as { data: Schedule[]; isLoading: boolean };
  return (
    <div className="space-y-3">
      {isLoading && [1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
      {!isLoading && schedules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">No scheduled reports configured.</div>
      )}
      {schedules.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium font-mono truncate">{s.cron_expression || s.run_at || "—"}</div>
            <div className="text-xs text-muted-foreground">Template: {s.template_id}</div>
          </div>
          <Badge variant={s.enabled ? "default" : "secondary"} className="text-[9px] h-4 px-1 shrink-0">
            {s.enabled ? "enabled" : "paused"}
          </Badge>
          {s.next_run_at && <span className="text-[10px] text-muted-foreground shrink-0">Next: {new Date(s.next_run_at).toLocaleDateString()}</span>}
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate, schedule, and manage test reports</p>
        </div>
        <Tabs defaultValue="generate">
          <TabsList>
            <TabsTrigger value="generate" className="gap-1.5 text-xs"><FileDown className="h-3.5 w-3.5" />Generate</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Templates</TabsTrigger>
            <TabsTrigger value="schedules" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Schedules</TabsTrigger>
          </TabsList>
          <TabsContent value="generate" className="mt-4"><GenerateTab /></TabsContent>
          <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
          <TabsContent value="schedules" className="mt-4"><SchedulesTab /></TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
