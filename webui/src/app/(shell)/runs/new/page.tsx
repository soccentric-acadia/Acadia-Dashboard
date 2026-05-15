"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getModuleRegistry, getModuleLabel, getCategoryForModule } from "@/lib/proto/registry";
import { useCreateRun, useConfigs } from "@/lib/api/queries";
import { ModuleIcon } from "@/components/primitives/module-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ModuleInfo } from "@/lib/proto/registry";
import type { TestMode } from "@/lib/api/types";
import {
  Check, ChevronRight, ChevronLeft, Play, Clock, Eye, Zap,
  Boxes, Search, AlertCircle, FileText,
} from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["single_shot", "long_term", "monitoring", "event_based"]),
  module_id: z.string().min(1, "Select a module"),
  config_id: z.string().optional(),
  iterations: z.coerce.number().min(1).default(1),
  duration_s: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = "basics" | "mode" | "module" | "config" | "review";
const STEPS: Step[] = ["basics", "mode", "module", "config", "review"];

const MODE_OPTIONS: { value: TestMode; label: string; description: string; icon: React.ElementType }[] = [
  { value: "single_shot", label: "Single Shot", description: "Run all tests once and collect results", icon: Zap },
  { value: "long_term", label: "Long Term", description: "Repeated cycles over extended time period", icon: Clock },
  { value: "monitoring", label: "Monitoring", description: "Continuous passive monitoring without assertions", icon: Eye },
  { value: "event_based", label: "Event Based", description: "Triggered by external hardware events", icon: Boxes },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all",
              i < current ? "border-primary bg-primary text-primary-foreground" :
              i === current ? "border-primary bg-primary/10 text-primary" :
              "border-border bg-background text-muted-foreground"
            )}>
              {i < current ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
            </div>
            <span className={cn(
              "text-[10px] capitalize",
              i === current ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {label}
            </span>
          </div>
          {i < total - 1 && (
            <div className={cn("h-px flex-1 mx-2 mb-4 transition-all", i < current ? "bg-primary" : "bg-border")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function BasicsStep({ register, errors }: { register: ReturnType<typeof useForm<FormValues>>["register"]; errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold">Run basics</h2>
        <p className="text-sm text-muted-foreground">Give your run a descriptive name</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Run name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g. Overnight stress test — network"
          className="font-mono"
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />{errors.name.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ModeStep({ value, onChange }: { value: TestMode; onChange: (v: TestMode) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold">Test mode</h2>
        <p className="text-sm text-muted-foreground">Choose how this run will execute</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODE_OPTIONS.map(({ value: v, label, description, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "text-left rounded-lg border p-4 space-y-1.5 transition-all hover:border-primary/60",
              value === v ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", value === v ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{label}</span>
              {value === v && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ModuleStep({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [filter, setFilter] = React.useState("");
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: getModuleRegistry,
    staleTime: Infinity,
  });

  const filtered = React.useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return modules;
    return modules.filter((m) => m.id.toLowerCase().includes(q) || getModuleLabel(m.id).toLowerCase().includes(q));
  }, [modules, filter]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, ModuleInfo[]>();
    for (const m of filtered) {
      const cat = getCategoryForModule(m);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    }
    return map;
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold">Select module</h2>
        <p className="text-sm text-muted-foreground">Choose the hardware module to test</p>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search modules…"
          className="pl-8 h-8 text-sm font-mono"
        />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {Array.from(grouped.entries()).map(([cat, mods]) => (
            <div key={cat}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 px-1">{cat}</div>
              <div className="space-y-1">
                {mods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange(m.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all hover:border-primary/60",
                      value === m.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60"
                    )}
                  >
                    <ModuleIcon moduleId={m.id} size="sm" className="text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs flex-1 truncate">{getModuleLabel(m.id)}</span>
                    <span className="font-mono text-[9px] text-muted-foreground/60 truncate">{m.id}</span>
                    {value === m.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ConfigStep({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const { data: configsPage, isLoading } = useConfigs();
  const configs = configsPage?.configs ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold">Configuration (optional)</h2>
        <p className="text-sm text-muted-foreground">Select an existing config or skip to use defaults</p>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No configurations available</p>
          <Button variant="outline" size="sm" asChild>
            <a href="/configs/new">Create config</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onChange("")}
            className={cn(
              "w-full text-left rounded-lg border px-3 py-2.5 transition-all hover:border-primary/60",
              !value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60"
            )}
          >
            <div className="text-sm font-medium">Use defaults</div>
            <div className="text-xs text-muted-foreground">No config — run with module defaults</div>
          </button>
          {configs.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => onChange(cfg.id)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2.5 transition-all hover:border-primary/60",
                value === cfg.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium flex-1 truncate">{cfg.name}</span>
                {value === cfg.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              {cfg.description && <div className="text-xs text-muted-foreground truncate">{cfg.description}</div>}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReviewStep({ values }: { values: FormValues }) {
  const modeOption = MODE_OPTIONS.find((m) => m.value === values.mode);
  const ModeIcon = modeOption?.icon ?? Zap;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-base font-semibold">Review & launch</h2>
        <p className="text-sm text-muted-foreground">Confirm details before starting the run</p>
      </div>
      <div className="rounded-lg border border-border/60 divide-y divide-border/40">
        {[
          { label: "Name", value: values.name },
          { label: "Module", value: <span className="font-mono text-xs">{getModuleLabel(values.module_id)}</span> },
          { label: "Mode", value: (
            <span className="flex items-center gap-1.5">
              <ModeIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {modeOption?.label ?? values.mode}
            </span>
          )},
          { label: "Config", value: values.config_id || <span className="text-muted-foreground italic">defaults</span> },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRunPage() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = React.useState(0);
  const currentStep = STEPS[stepIdx];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mode: "single_shot", module_id: "", iterations: 1, duration_s: 0 },
  });

  const values = watch();
  const createRun = useCreateRun();

  function canAdvance() {
    if (currentStep === "basics") return values.name.trim().length > 0;
    if (currentStep === "mode") return !!values.mode;
    if (currentStep === "module") return values.module_id.length > 0;
    return true;
  }

  async function onSubmit(data: FormValues) {
    try {
      const run = await createRun.mutateAsync({
        name: data.name,
        mode: data.mode,
        module_id: data.module_id,
        config_id: data.config_id || undefined,
        iterations: data.iterations,
        duration_s: data.duration_s || undefined,
      });
      toast.success("Run started!");
      router.push(`/runs/${run.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start run");
    }
  }

  const stepLabels = STEPS.map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">New Run</h1>
        <p className="text-sm text-muted-foreground">Configure and launch a hardware test run</p>
      </div>

      <StepIndicator current={stepIdx} total={STEPS.length} labels={stepLabels} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-card p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            {currentStep === "basics" && (
              <BasicsStep key="basics" register={register} errors={errors} />
            )}
            {currentStep === "mode" && (
              <ModeStep key="mode" value={values.mode} onChange={(v) => setValue("mode", v)} />
            )}
            {currentStep === "module" && (
              <ModuleStep key="module" value={values.module_id} onChange={(v) => setValue("module_id", v)} />
            )}
            {currentStep === "config" && (
              <ConfigStep key="config" value={values.config_id} onChange={(v) => setValue("config_id", v)} />
            )}
            {currentStep === "review" && (
              <ReviewStep key="review" values={values} />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((i) => i - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {currentStep === "review" ? (
            <Button
              type="submit"
              size="sm"
              disabled={createRun.isPending}
              className="gap-1.5"
            >
              <Play className="h-4 w-4" />
              {createRun.isPending ? "Starting…" : "Launch run"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={!canAdvance()}
              onClick={() => setStepIdx((i) => i + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
