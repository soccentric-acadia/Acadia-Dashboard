"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { getHealth, getModules, getRetentionSettings, getTarget, updateRetentionSettings } from "@/lib/api";
import { useAppShell } from "@/state/app-shell-context";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
            <span className="text-right text-sm font-medium">{value}</span>
        </div>
    );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
            <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-900/60">{children}</div>
        </section>
    );
}

export default function GeneralSettingsPage() {
    const { themeMode, setThemeMode } = useAppShell();
    const health = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 10_000 });
    const target = useQuery({ queryKey: ["target"], queryFn: getTarget, retry: 1 });
    const modules = useQuery({ queryKey: ["modules"], queryFn: getModules });
    const retention = useQuery({ queryKey: ["retention"], queryFn: getRetentionSettings });

    return (
        <div className="space-y-5 pb-8">
            <Group title="Connection">
                <Row label="Server address" value={process.env.NEXT_PUBLIC_ACADIA_SERVER ?? "http://localhost:8080"} />
                <Row label="Connection status" value={health.isError ? "Offline" : health.data?.status ?? "Checking"} />
                <Row label="Server version" value={health.data?.version ?? "Unavailable"} />
            </Group>

            <Group title="System">
                <Row label="Platform" value={target.data?.model ?? "Unknown"} />
                <Row label="Hostname" value={target.data?.hostname ?? "Unavailable"} />
                <Row label="Firmware" value={target.data?.client_version ?? "Unavailable"} />
                <Row label="HAL" value={target.data?.hal_version ?? "Unavailable"} />
                <Row label="Peripheral inventory" value={`${modules.data?.length ?? 0} modules`} />
            </Group>

            <Group title="Preferences">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">Appearance</span>
                    <select value={themeMode} onChange={(event) => setThemeMode(event.target.value as "system" | "light" | "dark")} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <Row label="Table density" value="Comfortable" />
                <Row label="Log auto-scroll default" value="Enabled" />
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">Retention days</span>
                    <input
                        type="number"
                        min={1}
                        defaultValue={retention.data?.retention_days ?? 30}
                        onBlur={(event) => void updateRetentionSettings({ retention_days: Number(event.target.value) })}
                        className="w-28 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-right text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                </div>
            </Group>

            <Group title="Operator">
                <Row label="Name" value={<input className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" aria-label="Operator name" />} />
                <Row label="Email" value={<input type="email" className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" aria-label="Operator email" />} />
                <Row label="Role" value={<span className="inline-flex items-center gap-1 text-zinc-500">Unassigned <ChevronRight size={14} /></span>} />
            </Group>
        </div>
    );
}