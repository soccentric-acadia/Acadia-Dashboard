"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getModuleRegistry, getModuleLabel, getCategoryForModule } from "@/lib/proto/registry";
import { useBoard } from "@/lib/board/context";
import { useConfigureRun, useStartRun } from "@/lib/api/queries";
import type { TestMode } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Check, Clock, Eye, Zap, Search, ChevronRight, ChevronLeft,
    Boxes, Play, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleInfo } from "@/lib/proto/registry";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "basics" | "mode" | "module" | "config" | "review";

const STEPS: Array<{ id: Step; label: string }> = [
    { id: "basics", label: "Basics" },
    { id: "mode", label: "Mode" },
    { id: "module", label: "Module" },
    { id: "config", label: "Config" },
    { id: "review", label: "Review" },
];

const MODES: Array<{
    value: TestMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}> = [
        { value: "single_shot", label: "Single Shot", description: "Run the module once and return one result.", icon: Check },
        { value: "long_term", label: "Long Term", description: "Run at a fixed interval for a set duration.", icon: Clock },
        { value: "monitoring", label: "Monitoring", description: "Continuously collect monitoring data.", icon: Eye },
        { value: "event_based", label: "Event Based", description: "Poll and fire when a condition is met.", icon: Zap },
    ];

// ── Zod schemas ───────────────────────────────────────────────────────────────

const basicsSchema = z.object({
    runName: z.string().min(1, "Run name is required"),
    description: z.string().optional(),
    tags: z.string().optional(),
});


const configSchema = z.object({
    interval_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(100).optional()),
    duration_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(0).optional()),
    run_forever: z.boolean().optional(),
    poll_interval_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(50).optional()),
    monitor_items: z.string().optional(),
    event_expression: z.string().optional(),
    module_config_json: z.string().optional(),
});

type BasicsValues = z.infer<typeof basicsSchema>;
type ConfigValues = z.infer<typeof configSchema>;

// ── Step components ───────────────────────────────────────────────────────────

function BasicsStep({ values, onChange }: {
    values: BasicsValues;
    onChange: (v: BasicsValues) => void;
}) {
    const form = useForm<BasicsValues>({
        resolver: zodResolver(basicsSchema) as Resolver<BasicsValues>,
        defaultValues: values,
    });

    const save = form.handleSubmit((v) => onChange(v));

    return (
        <div className="space-y-4" onBlur={() => { void save(); }}>
            <div className="space-y-1.5">
                <Label htmlFor="runName">Run name <span className="text-destructive">*</span></Label>
                <Input id="runName" placeholder="e.g. Smoke test after reboot" {...form.register("runName")} />
                {form.formState.errors.runName && (
                    <p className="text-xs text-destructive">{form.formState.errors.runName.message}</p>
                )}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Optional description" {...form.register("description")} />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="smoke, regression, rc1 (comma separated)" {...form.register("tags")} />
            </div>
        </div>
    );
}

function ModeStep({ value, onChange }: { value: TestMode; onChange: (v: TestMode) => void }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MODES.map(({ value: v, label, description, icon: Icon }) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(v)}
                    className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary",
                        value === v ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    )}
                >
                    <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", value === v ? "text-primary" : "text-muted-foreground")} />
                    <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {value === v && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
                </button>
            ))}
        </div>
    );
}

function ModuleStep({
    value,
    onChange,
}: {
    value: string;
    onChange: (id: string) => void;
}) {
    const [search, setSearch] = useState("");
    const { data: modules } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });

    const filtered = (modules ?? []).filter((m) => {
        const q = search.toLowerCase();
        return m.id.includes(q) || getModuleLabel(m.id).toLowerCase().includes(q) || getCategoryForModule(m.id).toLowerCase().includes(q);
    });

    const grouped = new Map<string, ModuleInfo[]>();
    for (const m of filtered) {
        const cat = getCategoryForModule(m.id);
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(m);
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search modules…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
                {Array.from(grouped.entries()).map(([cat, mods]) => (
                    <div key={cat}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                            {cat}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {mods.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => onChange(m.id)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all hover:border-primary",
                                        value === m.id
                                            ? "border-primary bg-primary/5 font-medium"
                                            : "border-border text-muted-foreground"
                                    )}
                                >
                                    <Boxes className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{getModuleLabel(m.id)}</span>
                                    {value === m.id && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No modules match your search.</p>
                )}
            </div>
        </div>
    );
}

function ConfigStep({
    mode,
    values,
    onChange,
}: {
    mode: TestMode;
    values: ConfigValues;
    onChange: (v: ConfigValues) => void;
}) {
    const form = useForm<ConfigValues>({
        resolver: zodResolver(configSchema) as Resolver<ConfigValues>,
        defaultValues: values,
    });
    const runForever = form.watch("run_forever");

    const save = form.handleSubmit((v) => onChange(v));

    return (
        <div className="space-y-4" onBlur={() => { void save(); }}>
            {(mode === "long_term" || mode === "monitoring") && (
                <>
                    <div className="space-y-1.5">
                        <Label>Interval (ms)</Label>
                        <Input type="number" min={100} defaultValue={1000} {...form.register("interval_ms")} />
                        <p className="text-xs text-muted-foreground">How often to sample, in milliseconds.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="run_forever"
                            {...form.register("run_forever")}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="run_forever">Run indefinitely</Label>
                    </div>
                    {!runForever && (
                        <div className="space-y-1.5">
                            <Label>Duration (ms)</Label>
                            <Input type="number" min={0} defaultValue={60000} {...form.register("duration_ms")} />
                        </div>
                    )}
                </>
            )}
            {mode === "monitoring" && (
                <div className="space-y-1.5">
                    <Label>Monitor items</Label>
                    <Input placeholder="temp, voltage, current (comma separated)" {...form.register("monitor_items")} />
                </div>
            )}
            {mode === "event_based" && (
                <>
                    <div className="space-y-1.5">
                        <Label>Poll interval (ms)</Label>
                        <Input type="number" min={50} defaultValue={500} {...form.register("poll_interval_ms")} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Event expression</Label>
                        <Input placeholder="e.g. value > 90" {...form.register("event_expression")} />
                        <p className="text-xs text-muted-foreground">Condition that triggers the event.</p>
                    </div>
                </>
            )}
            {mode === "single_shot" && (
                <p className="text-sm text-muted-foreground">Single-shot runs have no timing configuration. The module runs once and returns a result.</p>
            )}
            <div className="space-y-1.5">
                <Label>Module config (JSON)</Label>
                <textarea
                    className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder='{"key": "value"}'
                    {...form.register("module_config_json")}
                />
                <p className="text-xs text-muted-foreground">Module-specific configuration as JSON. Leave blank to use defaults.</p>
            </div>
        </div>
    );
}

// ── Review step ───────────────────────────────────────────────────────────────

function ReviewStep({
    basics,
    mode,
    moduleId,
    config,
    boardHostname,
}: {
    basics: BasicsValues;
    mode: TestMode;
    moduleId: string;
    config: ConfigValues;
    boardHostname: string;
}) {
    const items: Array<{ label: string; value: string }> = [
        { label: "Run name", value: basics.runName },
        { label: "Board", value: boardHostname },
        { label: "Module", value: getModuleLabel(moduleId) },
        { label: "Mode", value: MODES.find((m) => m.value === mode)?.label ?? mode },
    ];
    if (config.interval_ms) items.push({ label: "Interval", value: `${config.interval_ms} ms` });
    if (config.run_forever) items.push({ label: "Duration", value: "Indefinite" });
    else if (config.duration_ms) items.push({ label: "Duration", value: `${config.duration_ms} ms` });
    if (basics.description) items.push({ label: "Description", value: basics.description });
    if (basics.tags) items.push({ label: "Tags", value: basics.tags });

    return (
        <div className="space-y-4">
            <div className="rounded-lg border divide-y">
                {items.map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                        <span className="text-sm font-medium text-right">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main stepper page ─────────────────────────────────────────────────────────

function NewRunContent() {
    const router = useRouter();
    const { board } = useBoard();

    const [step, setStep] = useState<Step>("basics");
    const [basics, setBasics] = useState<BasicsValues>({ runName: "", description: "", tags: "" });
    const [mode, setMode] = useState<TestMode>("single_shot");
    const [moduleId, setModuleId] = useState("");
    const [config, setConfig] = useState<ConfigValues>({});

    const configureRunMut = useConfigureRun();
    const startRunMut = useStartRun();

    const currentIndex = STEPS.findIndex((s) => s.id === step);

    const canAdvance = () => {
        if (step === "basics") return basics.runName.trim().length > 0;
        if (step === "module") return moduleId.length > 0;
        return true;
    };

    const advance = () => {
        const next = STEPS[currentIndex + 1];
        if (next) setStep(next.id);
    };

    const back = () => {
        const prev = STEPS[currentIndex - 1];
        if (prev) setStep(prev.id);
    };

    const buildConfig = (): Record<string, unknown> => {
        const cfg: Record<string, unknown> = {};
        if (config.interval_ms) cfg.interval_ms = config.interval_ms;
        if (config.run_forever) cfg.run_forever = true;
        else if (config.duration_ms) cfg.duration_ms = config.duration_ms;
        if (config.poll_interval_ms) cfg.poll_interval_ms = config.poll_interval_ms;
        if (config.monitor_items) {
            cfg.monitor_item_names = config.monitor_items.split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (config.event_expression) cfg.event_expression = config.event_expression;
        if (config.module_config_json?.trim()) {
            try {
                Object.assign(cfg, JSON.parse(config.module_config_json));
            } catch {
                // ignore malformed JSON
            }
        }
        cfg._runName = basics.runName;
        if (basics.description) cfg._description = basics.description;
        if (basics.tags) cfg._tags = basics.tags.split(",").map((t) => t.trim()).filter(Boolean);
        return cfg;
    };

    const handleStart = async () => {
        if (!board) { toast.error("No board configured"); return; }
        try {
            const result = await configureRunMut.mutateAsync({
                clientId: board.clientId,
                moduleId,
                mode,
                config: buildConfig(),
            });
            await startRunMut.mutateAsync(result.runId);
            router.push(`/runs/${result.runId}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to start run");
        }
    };

    const isLaunching = configureRunMut.isPending || startRunMut.isPending;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">New Run</h1>
                <p className="text-muted-foreground text-sm mt-1">Configure and start a new test run on your board.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0">
                {STEPS.map(({ id, label }, i) => {
                    const done = STEPS.findIndex((s) => s.id === step) > i;
                    const active = id === step;
                    return (
                        <div key={id} className="flex items-center gap-0">
                            <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                                    done ? "border-primary bg-primary text-primary-foreground"
                                        : active ? "border-primary text-primary"
                                            : "border-muted text-muted-foreground"
                                )}>
                                    {done ? <Check className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className={cn("text-xs", active ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={cn("h-0.5 w-10 sm:w-16 mx-1 mt-[-14px]", done ? "bg-primary" : "bg-border")} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step content */}
            <Card>
                <CardContent className="pt-6">
                    {!board && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            No board configured. <a href="/settings" className="underline ml-1">Add a board first.</a>
                        </div>
                    )}

                    {step === "basics" && <BasicsStep values={basics} onChange={setBasics} />}
                    {step === "mode" && <ModeStep value={mode} onChange={setMode} />}
                    {step === "module" && <ModuleStep value={moduleId} onChange={setModuleId} />}
                    {step === "config" && <ConfigStep mode={mode} values={config} onChange={setConfig} />}
                    {step === "review" && (
                        <ReviewStep
                            basics={basics}
                            mode={mode}
                            moduleId={moduleId}
                            config={config}
                            boardHostname={board?.hostname ?? board?.clientId ?? "—"}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={back} disabled={currentIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>

                <div className="flex items-center gap-2">
                    {step === "review" ? (
                        <Button onClick={handleStart} disabled={!board || isLaunching}>
                            <Play className="h-4 w-4 mr-1.5" />
                            {isLaunching ? "Starting…" : "Start now"}
                        </Button>
                    ) : (
                        <Button onClick={advance} disabled={!canAdvance()}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NewRunPage() {
    return (
        <Suspense fallback={<div className="p-4"><Skeleton className="h-8 w-40" /></div>}>
            <NewRunContent />
        </Suspense>
    );
}
