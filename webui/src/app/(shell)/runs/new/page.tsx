"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useCreateRun, useConfigs } from "@/lib/api/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TestMode, TestConfig } from "@/lib/api/types";
import {
  Check, ChevronRight, ChevronLeft, Play, Clock, Eye, Zap, Boxes, FileText, AlertCircle,
} from "lucide-react";
import { pageVariants } from "@/components/motion/presets";

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = "basics" | "config" | "review";
const STEPS: Step[] = ["basics", "config", "review"];

type FormValues = {
  name: string;
  mode: TestMode;
  config_id: string;
};

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
            <span className={cn("text-[10px] capitalize", i === current ? "text-foreground font-medium" : "text-muted-foreground")}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRunPage() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = React.useState(0);
  const currentStep = STEPS[stepIdx];

  const [formValues, setFormValues] = React.useState<FormValues>({
    name: "",
    mode: "single_shot",
    config_id: "",
  });

  const { data: configs, isLoading: configsLoading } = useConfigs() as { data: TestConfig[] | undefined; isLoading: boolean };
  const createRun = useCreateRun();

  function canAdvance() {
    if (currentStep === "basics") return true; // name optional
    if (currentStep === "config") return formValues.config_id.length > 0;
    return true;
  }

  async function onSubmit() {
    if (!formValues.config_id) { toast.error("Select a config"); return; }
    try {
      const run = await createRun.mutateAsync({
        config_id: formValues.config_id,
        mode: formValues.mode,
        name: formValues.name || undefined,
      });
      toast.success("Run started!");
      router.push(`/runs/${run.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start run");
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">New Run</h1>
        <p className="text-sm text-muted-foreground">Configure and launch a hardware test run</p>
      </div>

      <StepIndicator current={stepIdx} total={STEPS.length} labels={STEPS} />

      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-card p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            {/* ── Basics ── */}
            {currentStep === "basics" && (
              <motion.div key="basics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Run basics</h2>
                  <p className="text-sm text-muted-foreground">Give your run an optional name and choose mode</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs">Run name (optional)</Label>
                  <Input
                    id="name"
                    value={formValues.name}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                    placeholder="e.g. Overnight stress test"
                    className="font-mono"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Test mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormValues((v) => ({ ...v, mode: value }))}
                        className={cn(
                          "text-left rounded-lg border p-3 space-y-1 transition-all hover:border-primary/60",
                          formValues.mode === value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5", formValues.mode === value ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium">{label}</span>
                          {formValues.mode === value && <Check className="h-3 w-3 text-primary ml-auto" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Config selection ── */}
            {currentStep === "config" && (
              <motion.div key="config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Select configuration</h2>
                  <p className="text-sm text-muted-foreground">Choose which test config defines the modules and parameters</p>
                </div>
                {configsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
                ) : !configs || configs.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">No configurations available</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/configs/new">Create config</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {configs.map((cfg: TestConfig) => (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => setFormValues((v) => ({ ...v, config_id: cfg.id }))}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2.5 transition-all hover:border-primary/60",
                          formValues.config_id === cfg.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium flex-1 truncate">{cfg.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono">{cfg.mode.replace("_", " ")}</Badge>
                          {formValues.config_id === cfg.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        {cfg.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{cfg.description}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Review ── */}
            {currentStep === "review" && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Review & launch</h2>
                  <p className="text-sm text-muted-foreground">Confirm details before starting the run</p>
                </div>
                <div className="rounded-lg border border-border/60 divide-y divide-border/40">
                  {[
                    { label: "Name", value: formValues.name || <span className="text-muted-foreground italic">Auto-generated</span> },
                    { label: "Mode", value: MODE_OPTIONS.find((m) => m.value === formValues.mode)?.label ?? formValues.mode },
                    { label: "Config", value: configs?.find((c: TestConfig) => c.id === formValues.config_id)?.name ?? formValues.config_id },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {currentStep === "review" ? (
            <Button
              type="button"
              size="sm"
              disabled={createRun.isPending || !formValues.config_id}
              className="gap-1.5"
              onClick={onSubmit}
            >
              <Play className="h-4 w-4" />
              {createRun.isPending ? "Starting…" : "Launch run"}
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={!canAdvance()} onClick={() => setStepIdx((i) => i + 1)} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
