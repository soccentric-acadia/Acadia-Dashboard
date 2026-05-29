"use client";

import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ChevronRight, Upload } from "lucide-react";
import { useState } from "react";
import { getHealth, getModules, getRetentionSettings, getTarget, updateRetentionSettings, uploadOtaArtifact } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppShell } from "@/state/app-shell-context";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-medium">{value}</span>
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">{children}</CardContent>
        </Card>
    );
}

function OtaHostCard() {
    const steps = ["Uploading", "Verifying", "Applying", "Reloading"];
    const [activeStep, setActiveStep] = useState(-1);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(file: File) {
        setError(null);
        setLogs([`Selected ${file.name} (${file.size} bytes)`]);
        setActiveStep(0);
        try {
            await uploadOtaArtifact(file);
            setLogs((prev) => [...prev, "Upload accepted by server", "Waiting for server-side OTA status updates"]);
            setActiveStep(1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">OTA — Host</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">Upload a host update bundle to apply a server-side update.</p>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-5 text-center transition-colors hover:bg-muted/60">
                    <Upload size={18} className="mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload host bundle</span>
                    <span className="mt-1 text-xs text-muted-foreground">Click to browse or drag &amp; drop</span>
                    <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])} />
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {steps.map((step, i) => (
                        <div key={step} className={clsx("rounded-lg border px-2 py-1.5 text-center text-xs", i <= activeStep ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground")}>{step}</div>
                    ))}
                </div>
                {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
                {logs.length > 0 && (
                    <details open>
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Logs</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">{logs.join("\n")}</pre>
                    </details>
                )}
            </CardContent>
        </Card>
    );
}

function OtaDeviceCard() {
    const uploadSteps = ["Upload to server", "Transfer to device", "Landed in /tmp", "(Future) Trigger"];
    const [source, setSource] = useState<"upload" | "fetch">("upload");
    const [activeStep, setActiveStep] = useState(-1);
    const [landedPath, setLandedPath] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(file: File) {
        setError(null);
        setLandedPath(null);
        setLogs([`Selected ${file.name} (${file.size} bytes)`, "Uploading to server"]);
        setActiveStep(0);
        try {
            await uploadOtaArtifact(file);
            const path = `/tmp/${file.name}`;
            setActiveStep(2);
            setLandedPath(path);
            setLogs((prev) => [...prev, "Server accepted image", `Transfer requested for ${path}`, "Update trigger not yet implemented"]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">OTA — Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">Push a firmware image to the connected target device.</p>
                <div className="inline-flex gap-0.5 rounded-lg border border-border bg-muted p-0.5">
                    <button type="button" onClick={() => setSource("upload")} className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", source === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Upload image</button>
                    <button type="button" onClick={() => setSource("fetch")} className={clsx("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", source === "fetch" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Fetch from server</button>
                </div>
                {source === "upload" ? (
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-5 text-center transition-colors hover:bg-muted/60">
                        <Upload size={18} className="mb-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Upload target image</span>
                        <span className="mt-1 text-xs text-muted-foreground">Server transfers image to device /tmp</span>
                        <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])} />
                    </label>
                ) : (
                    <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-4 opacity-70">
                        <span className="inline-flex rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:text-yellow-300">Coming soon</span>
                        <input disabled placeholder="https://updates.example/device.img" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm opacity-60" />
                        <button disabled className="rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">Fetch image</button>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                    {uploadSteps.map((step, i) => (
                        <div key={step} className={clsx("rounded-lg border px-2 py-1.5 text-xs", i <= activeStep && i < 3 ? "border-primary/50 bg-primary/10 text-primary" : i === 3 ? "border-border bg-muted/50 text-muted-foreground/50" : "border-border bg-muted text-muted-foreground")}>{step}</div>
                    ))}
                </div>
                {landedPath && <p className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300">Image on target at {landedPath}.</p>}
                {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
                {logs.length > 0 && (
                    <details open>
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Logs</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 font-mono text-xs">{logs.join("\n")}</pre>
                    </details>
                )}
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
    const { themeMode, setThemeMode } = useAppShell();
    const health = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 10_000 });
    const target = useQuery({ queryKey: ["target"], queryFn: getTarget, retry: 1 });
    const modules = useQuery({ queryKey: ["modules"], queryFn: getModules });
    const retention = useQuery({ queryKey: ["retention"], queryFn: getRetentionSettings });

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SectionCard title="Connection">
                <Row label="Server address" value={process.env.NEXT_PUBLIC_ACADIA_SERVER ?? "http://localhost:8080"} />
                <Row label="Status" value={health.isError ? "Offline" : (health.data?.status ?? "Checking")} />
                <Row label="Version" value={health.data?.version ?? "Unavailable"} />
            </SectionCard>

            <SectionCard title="System">
                <Row label="Platform" value={target.data?.model ?? "Unknown"} />
                <Row label="Hostname" value={target.data?.hostname ?? "Unavailable"} />
                <Row label="Firmware" value={target.data?.client_version ?? "Unavailable"} />
                <Row label="HAL" value={target.data?.hal_version ?? "Unavailable"} />
                <Row label="Modules" value={`${modules.data?.length ?? 0}`} />
            </SectionCard>

            <SectionCard title="Preferences">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                    <span className="text-sm text-muted-foreground">Appearance</span>
                    <select
                        value={themeMode}
                        onChange={(e) => setThemeMode(e.target.value as "system" | "light" | "dark")}
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <Row label="Table density" value="Comfortable" />
                <Row label="Log auto-scroll" value="Enabled" />
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Retention days</span>
                    <input
                        type="number"
                        min={1}
                        defaultValue={retention.data?.retention_days ?? 30}
                        onBlur={(e) => void updateRetentionSettings({ retention_days: Number(e.target.value) })}
                        className="h-9 w-24 rounded-md border border-input bg-transparent px-3 text-right text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
            </SectionCard>

            <SectionCard title="Operator">
                <Row label="Name" value={<input className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="Operator name" />} />
                <Row label="Email" value={<input type="email" className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label="Operator email" />} />
                <Row label="Role" value={<span className="inline-flex items-center gap-1 text-muted-foreground">Unassigned <ChevronRight size={14} /></span>} />
            </SectionCard>

            <OtaHostCard />
            <OtaDeviceCard />
        </div>
    );
}