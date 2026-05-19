"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MODULE_CATALOG, CATEGORY_ORDER } from "@/proto/module-catalog";
import { useConfigStore } from "@/lib/config-store";
import type { TestMode } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Eye, Zap, Check } from "lucide-react";
import { SchemaForm } from "@/components/form-builder/schema-form";
import { descriptorFieldsToSchemaFields } from "@/lib/schema/module-schema";

const MODES: Array<{ value: TestMode; label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: "single_shot", label: "Single Shot", description: "Run once, return one result.", icon: Check },
    { value: "long_term", label: "Long Term", description: "Run at interval for a fixed duration.", icon: Clock },
    { value: "monitoring", label: "Monitoring", description: "Run at interval, collect monitor items.", icon: Eye },
    { value: "event_based", label: "Event Based", description: "Poll continuously, fire on condition.", icon: Zap },
];

const baseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    moduleId: z.string().min(1, "Module is required"),
    mode: z.enum(["single_shot", "long_term", "monitoring", "event_based"]),
    interval_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(100).optional()),
    duration_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(0).optional()),
    run_forever: z.boolean().optional(),
    poll_interval_ms: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().int().min(50).optional()),
    monitor_items: z.string().optional(),
    event_test_name: z.string().optional(),
    event_expected_pass: z.boolean().optional(),
    event_expression: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema>;

interface ConfigBuilderProps {
    defaultValues?: Partial<FormValues> & { moduleConfig?: Record<string, unknown> };
    onSaved?: (id: string) => void;
}

export function ConfigBuilder({ defaultValues, onSaved }: ConfigBuilderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const saveConfig = useConfigStore((s) => s.save);
    const [moduleConfig, setModuleConfig] = useState<Record<string, unknown>>(
        defaultValues?.moduleConfig ?? {}
    );

    // All modules from static catalog — always available, no fetch needed
    const modules = useMemo(() =>
        Object.values(MODULE_CATALOG).sort((a, b) => {
            const catOrder = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
            return catOrder !== 0 ? catOrder : a.displayName.localeCompare(b.displayName);
        }),
        []);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(baseSchema) as Resolver<FormValues>,
        defaultValues: {
            name: defaultValues?.name ?? "",
            moduleId: defaultValues?.moduleId ?? searchParams.get("moduleId") ?? "",
            mode: defaultValues?.mode ?? "single_shot",
            interval_ms: defaultValues?.interval_ms ?? 1000,
            duration_ms: defaultValues?.duration_ms ?? 60000,
            run_forever: defaultValues?.run_forever ?? false,
            poll_interval_ms: defaultValues?.poll_interval_ms ?? 500,
            event_expected_pass: defaultValues?.event_expected_pass ?? true,
        },
    });

    const selectedMode = watch("mode");
    const selectedModuleId = watch("moduleId");
    const runForever = watch("run_forever");

    const onSubmit = (values: FormValues) => {
        const saved = saveConfig({
            name: values.name,
            moduleId: values.moduleId,
            mode: values.mode,
            commonConfig: {
                interval_ms: values.interval_ms,
                duration_ms: values.run_forever ? undefined : values.duration_ms,
                run_forever: values.run_forever,
                poll_interval_ms: values.poll_interval_ms,
                monitor_item_names: values.monitor_items
                    ? values.monitor_items.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [],
                event_condition:
                    values.mode === "event_based"
                        ? {
                            test_name: values.event_test_name,
                            expected_pass: values.event_expected_pass,
                            expression: values.event_expression,
                        }
                        : undefined,
            },
            moduleConfig,
        });
        toast.success(`Config "${saved.name}" saved`);
        if (onSaved) {
            onSaved(saved.id);
        } else {
            router.push(`/configs/${saved.id}`);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Name */}
            <Card>
                <CardHeader><CardTitle>1. Name</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-1 max-w-sm">
                        <Label htmlFor="cfg-name">Configuration name</Label>
                        <Input id="cfg-name" placeholder="e.g. CPU stress 30s" {...register("name")} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Module */}
            <Card>
                <CardHeader><CardTitle>2. Module</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-1 max-w-sm">
                        <Label htmlFor="cfg-module">HAL module</Label>
                        <Select
                            value={selectedModuleId}
                            onValueChange={(v) => setValue("moduleId", v)}
                        >
                            <SelectTrigger id="cfg-module">
                                <SelectValue placeholder="Select a module…" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {modules.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.displayName}
                                        {m.status === "deprecated" && (
                                            <Badge variant="secondary" className="ml-2 text-xs">deprecated</Badge>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.moduleId && <p className="text-xs text-destructive">{errors.moduleId.message}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Mode */}
            <Card>
                <CardHeader><CardTitle>3. Execution Mode</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {MODES.map(({ value, label, description, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setValue("mode", value)}
                                className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent ${selectedMode === value ? "border-primary bg-accent" : ""}`}
                            >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <div className="font-medium text-sm">{label}</div>
                                    <div className="text-xs text-muted-foreground">{description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Mode-specific fields */}
            {selectedMode !== "single_shot" && (
                <Card>
                    <CardHeader><CardTitle>4. Mode Parameters</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {(selectedMode === "long_term" || selectedMode === "monitoring") && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Interval (ms)</Label>
                                        <Input type="number" {...register("interval_ms")} />
                                        {errors.interval_ms && <p className="text-xs text-destructive">{errors.interval_ms.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Duration (ms)</Label>
                                        <Input type="number" {...register("duration_ms")} disabled={!!runForever} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="run-forever"
                                        checked={!!runForever}
                                        onCheckedChange={(v) => setValue("run_forever", v)}
                                    />
                                    <Label htmlFor="run-forever">Run until stopped</Label>
                                </div>
                            </>
                        )}
                        {selectedMode === "monitoring" && (
                            <div className="space-y-1">
                                <Label>Monitor items (comma-separated names)</Label>
                                <Input placeholder="cpu_temp_c, cpu_usage_pct" {...register("monitor_items")} />
                            </div>
                        )}
                        {selectedMode === "event_based" && (
                            <>
                                <div className="space-y-1 max-w-sm">
                                    <Label>Poll interval (ms)</Label>
                                    <Input type="number" {...register("poll_interval_ms")} />
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <Label>Trigger: test name</Label>
                                    <Input placeholder="testL1Cache" {...register("event_test_name")} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="evt-pass"
                                        defaultChecked
                                        onCheckedChange={(v) => setValue("event_expected_pass", v)}
                                    />
                                    <Label htmlFor="evt-pass">Fire when test passes</Label>
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <Label>Or: expression</Label>
                                    <Input placeholder='cpu_temp_c > 80' {...register("event_expression")} />
                                    <p className="text-xs text-muted-foreground">Used when test name is empty.</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Module-specific config */}
            {selectedModuleId && (
                <Card>
                    <CardHeader>
                        <CardTitle>5. Module Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ModuleConfigSection
                            moduleId={selectedModuleId}
                            value={moduleConfig}
                            onChange={setModuleConfig}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2">
                <Button type="submit">Save configuration</Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
        </form>
    );
}

// Schema-driven module config section — driven by MODULE_CATALOG configSchema.
function ModuleConfigSection({
    moduleId,
    value,
    onChange,
}: {
    moduleId: string;
    value: Record<string, unknown>;
    onChange: (v: Record<string, unknown>) => void;
}) {
    const moduleDef = MODULE_CATALOG[moduleId];
    const fields = useMemo(
        () => moduleDef ? descriptorFieldsToSchemaFields(moduleDef.configSchema.fields) : [],
        [moduleDef]
    );

    if (!moduleDef) {
        return <p className="text-xs text-muted-foreground italic">Unknown module.</p>;
    }

    return (
        <SchemaForm
            fields={fields}
            value={value}
            onChange={onChange}
        />
    );
}
