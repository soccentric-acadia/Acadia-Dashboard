"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useCreateRun, useTemplates } from "@/data";
import { useConnectionStore } from "@/data";
import { MODULE_CATALOG, CATEGORY_ORDER, MODULES_BY_CATEGORY } from "@/proto/types";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { TestMode } from "@/lib/api/types";
import { pageVariants } from "@/components/motion/presets";
import {
  Play, Zap, Clock, Eye, Boxes, ChevronDown, ChevronRight,
  LayoutList, Info, CheckSquare, Square,
} from "lucide-react";

const MODE_OPTIONS: { value: TestMode; label: string; description: string; icon: React.ElementType }[] = [
  { value: "single_shot", label: "Single Shot", description: "Run all tests once and collect results", icon: Zap },
  { value: "long_term", label: "Long Term", description: "Run repeatedly at a frequency, stream results", icon: Clock },
  { value: "monitoring", label: "Monitoring", description: "Continuous passive monitoring without assertions", icon: Eye },
  { value: "event_based", label: "Event Based", description: "Triggered by external hardware events", icon: Boxes },
];

function ModulePicker({
  selected, onToggle, onSelectAll, onClearAll,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [filter, setFilter] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const filteredGroups = React.useMemo(() => {
    const q = filter.toLowerCase();
    return CATEGORY_ORDER.map((cat) => {
      const mods = (MODULES_BY_CATEGORY[cat] ?? []).filter(
        (m) => !q || m.displayName.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      );
      return { cat, mods };
    }).filter((g) => g.mods.length > 0);
  }, [filter]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter modules…" className="h-7 text-xs flex-1" />
        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 shrink-0 gap-1" onClick={onSelectAll}>
          <CheckSquare className="h-3 w-3" /> All
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 shrink-0 gap-1" onClick={onClearAll}>
          <Square className="h-3 w-3" /> None
        </Button>
      </div>
      <ScrollArea className="h-64 pr-1">
        <div className="space-y-0.5">
          {filteredGroups.map(({ cat, mods }) => (
            <div key={cat}>
              <button type="button"
                className="flex w-full items-center gap-1 px-1 py-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
              >
                {collapsed[cat] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {cat.replace(/_/g, " ")} ({mods.length})
              </button>
              {!collapsed[cat] && mods.map((m) => (
                <button key={m.id} type="button" onClick={() => onToggle(m.id)}
                  className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent/50", selected.has(m.id) && "bg-primary/5")}
                >
                  <Checkbox checked={selected.has(m.id)} onCheckedChange={() => onToggle(m.id)} className="h-3.5 w-3.5 shrink-0" />
                  <ModuleIcon moduleId={m.id} size="sm" className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{m.displayName}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ModeFields({ mode, frequencyHz, onFrequency }: { mode: TestMode; frequencyHz: number; onFrequency: (v: number) => void }) {
  if (mode === "long_term" || mode === "monitoring") {
    return (
      <div className="mt-3 flex items-center gap-3">
        <Label className="text-xs text-muted-foreground shrink-0">Frequency (Hz)</Label>
        <Input type="number" min={0.001} max={1000} step={0.1} value={frequencyHz}
          onChange={(e) => onFrequency(parseFloat(e.target.value) || 1)}
          className="h-7 w-28 text-xs font-mono" />
        <span className="text-xs text-muted-foreground">= {(1 / frequencyHz).toFixed(2)} s interval</span>
      </div>
    );
  }
  if (mode === "event_based") {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        <Info className="h-3 w-3 inline mr-1" />
        Emits results only when the hardware condition trips. Fire a manual event from the run detail page in simulated mode.
      </p>
    );
  }
  return null;
}

export default function NewRunPage() {
  const router = useRouter();
  const createRun = useCreateRun();
  const { data: templates = [] } = useTemplates() as { data: { id: string; name: string; mode: TestMode }[]; isLoading: boolean };
  const isSimMode = useConnectionStore((s) => s.state === "simulated");

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mode, setMode] = React.useState<TestMode>("single_shot");
  const [frequencyHz, setFrequencyHz] = React.useState(1);
  const [selectedModules, setSelectedModules] = React.useState<Set<string>>(() => new Set(Object.keys(MODULE_CATALOG)));
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");

  const allModuleIds = Object.keys(MODULE_CATALOG);

  const toggleModule = (id: string) => setSelectedModules((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  };

  const estimatedDuration = React.useMemo(() => {
    if (mode === "single_shot") return `~${selectedModules.size * 0.5}s (single shot)`;
    if (mode === "event_based") return "Until stopped";
    return `Continuous @ ${frequencyHz} Hz`;
  }, [mode, frequencyHz, selectedModules.size]);

  async function handleLaunch() {
    try {
      const run = await createRun.mutateAsync({
        name: name || undefined,
        mode,
        config_id: templateId || undefined,
      } as Parameters<typeof createRun.mutateAsync>[0]);
      toast.success("Run started!");
      router.push(`/runs/${run.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start run");
    }
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">New Run</h1>
          <p className="text-sm text-muted-foreground">Configure and launch a hardware test run</p>
          {isSimMode && <Badge variant="outline" className="mt-1 text-[10px] border-purple-500/40 text-purple-400">Simulation mode — results will be synthetic</Badge>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Form ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Identity */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LayoutList className="h-3 w-3" /> Identity
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="run-name" className="text-xs">Run name <span className="text-muted-foreground">(optional)</span></Label>
                  <Input id="run-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Overnight stress test" className="font-mono" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <div className="flex flex-wrap gap-1 items-center min-h-9 px-2 py-1 rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                        {t}<button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "Type tag + Enter…" : ""} className="flex-1 min-w-16 bg-transparent outline-none text-xs placeholder:text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="run-desc" className="text-xs">Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea id="run-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you testing?" className="resize-none h-14 text-sm" />
              </div>
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Load from template <span className="text-muted-foreground">(optional)</span></Label>
                  <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); const t = templates.find((x) => x.id === e.target.value); if (t) setMode(t.mode); }}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="">— No template —</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Mode */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test Mode</div>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as TestMode)} className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                  <label key={value} htmlFor={`mode-${value}`}
                    className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all hover:border-primary/60",
                      mode === value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border")}
                  >
                    <RadioGroupItem value={value} id={`mode-${value}`} className="mt-0.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", mode === value ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-xs font-semibold">{label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <ModeFields mode={mode} frequencyHz={frequencyHz} onFrequency={setFrequencyHz} />
            </div>

            {/* Modules */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modules</div>
                <span className="text-xs text-muted-foreground">{selectedModules.size} / {allModuleIds.length} selected</span>
              </div>
              <ModulePicker selected={selectedModules} onToggle={toggleModule}
                onSelectAll={() => setSelectedModules(new Set(allModuleIds))}
                onClearAll={() => setSelectedModules(new Set())} />
            </div>
          </div>

          {/* ── Summary + Launch ── */}
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 sticky top-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Run Summary</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="text-muted-foreground shrink-0">Name</span>
                <span className="font-mono text-right truncate max-w-36">{name || <em className="text-muted-foreground/50">unnamed</em>}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mode</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">{mode.replace(/_/g, " ")}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-technical font-semibold">{selectedModules.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Est. duration</span>
                <span className="text-right max-w-36">{estimatedDuration}</span>
              </div>
              {(mode === "long_term" || mode === "monitoring") && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-mono">{frequencyHz} Hz</span>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  {tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1">{t}</Badge>)}
                </div>
              )}
            </div>

            <Separator />

            {selectedModules.size === 0 && (
              <p className="text-xs text-status-fail">Select at least one module</p>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full gap-2" disabled={selectedModules.size === 0 || createRun.isPending}>
                  <Play className="h-4 w-4" />
                  {createRun.isPending ? "Starting…" : "Start Run"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start this run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Launch a <strong>{mode.replace(/_/g, " ")}</strong> run across <strong>{selectedModules.size}</strong> module{selectedModules.size !== 1 ? "s" : ""}.
                    {isSimMode && " Results will be synthetic (simulated mode)."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLaunch} disabled={createRun.isPending}>
                    {createRun.isPending ? "Starting…" : "Start Now"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
