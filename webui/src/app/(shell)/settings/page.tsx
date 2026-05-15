"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bell, Database, Monitor, Wifi, Wrench, User, Cpu,
    Plus, Server, KeyRound, Save, AlertCircle, Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    changePassword, fetchRetentionSettings, updateRetentionSettings,
    listApiTokens, createApiToken, revokeApiToken,
    fetchAlertRules, createAlertRule, deleteAlertRule,
    type RetentionSettings, type AlertRule, type CreateAlertInput,
} from "@/lib/api/client";
import { useBoard } from "@/lib/board/context";
import { getSessionUser } from "@/lib/auth/session";

import { toast } from "sonner";

// ── Board Tab ──────────────────────────────────────────────────────────────

function BoardTab() {
    const { board, isLoading } = useBoard();

    if (isLoading) return <Skeleton className="h-40 w-full" />;

    if (!board) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No board connected. Make sure the Acadia Client is running on your board and can reach this server.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">{board.name || board.hostname}</p>
                        <p className="text-xs text-muted-foreground font-mono">{board.id}</p>
                    </div>
                    <Badge variant={board.status === "online" ? "default" : "secondary"}>
                        {board.status}
                    </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs">Hostname</p>
                        <p>{board.hostname || "\u2014"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Model</p>
                        <p>{board.model || "\u2014"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">HAL Version</p>
                        <p>{board.hal_version || "\u2014"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Client Version</p>
                        <p>{board.client_version || "\u2014"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">OS Version</p>
                        <p>{board.os_version || "\u2014"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Last seen</p>
                        <p>{board.last_seen ? new Date(board.last_seen).toLocaleString() : "\u2014"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Account Tab ────────────────────────────────────────────────────────────

function AccountTab() {
    const user = getSessionUser();
    const [newLabel, setNewLabel] = useState("");
    const [showNewToken, setShowNewToken] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <CardTitle className="text-base">Session</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Logged in as <strong>{user?.username ?? "admin"}</strong>. Session is managed by server-issued cookie.
                </p>
                <p className="text-xs text-muted-foreground">To change your password, ask your system administrator to update the server configuration.</p>
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">API tokens</CardTitle>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Token label (e.g. CLI access)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!newLabel.trim()}
                        onClick={async () => {
                            try {
                                const { token_str } = await (await import("@/lib/api/client")).createApiToken(newLabel.trim());
                                setShowNewToken(token_str);
                                setNewLabel("");
                                toast.success("Token created. Copy it now — it won't be shown again.");
                            } catch (e) {
                                toast.error((e as Error).message);
                            }
                        }}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Generate
                    </Button>
                </div>
                {showNewToken && (
                    <div className="rounded bg-muted p-3 text-xs font-mono break-all">
                        {showNewToken}
                        <Button size="sm" variant="ghost" className="ml-2 h-6 text-xs" onClick={() => setShowNewToken(null)}>Dismiss</Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Versions Tab ───────────────────────────────────────────────────────────

function VersionsTab() {
    const { board } = useBoard();
    const items = [
        { label: "HAL", value: board?.hal_version ?? "\u2014" },
        { label: "Client", value: board?.client_version ?? "\u2014" },
        { label: "OS", value: board?.os_version ?? "\u2014" },
        { label: "Web UI", value: process.env.NEXT_PUBLIC_VERSION ?? "dev" },
    ];
    return (
        <div className="space-y-3">
            {items.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-mono">{value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Network Tab ────────────────────────────────────────────────────────────

function NetworkTab() {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "(same origin)";
    return (
        <div className="space-y-3">
            <div className="rounded-lg border divide-y text-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground">REST API base</span>
                    <span className="font-mono">{base}/api/v1</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground">SSE events</span>
                    <span className="font-mono">/api/v1/runs/{"{id}"}/events</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                To change the server URL, set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_BASE</code> in your environment.
            </p>
        </div>
    );
}

// ── Stub tabs ──────────────────────────────────────────────────────────────

function AlertsTab() {
    const qc = useQueryClient();
    const { data: rules = [], isLoading } = useQuery<AlertRule[]>({
        queryKey: ["alert-rules"],
        queryFn: fetchAlertRules,
    });

    const [form, setForm] = useState<CreateAlertInput>({
        module_id: "", field_path: "", operator: ">", threshold: 0, severity: "warning",
    });
    const [showForm, setShowForm] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAlertRule(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["alert-rules"] }); toast.success("Rule deleted"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const createMutation = useMutation({
        mutationFn: (input: CreateAlertInput) => createAlertRule(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alert-rules"] });
            toast.success("Alert rule created");
            setShowForm(false);
            setForm({ module_id: "", field_path: "", operator: ">", threshold: 0, severity: "warning" });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />Alert rules
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />{showForm ? "Cancel" : "Add rule"}
                </Button>
            </div>

            {showForm && (
                <div className="rounded-md border p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground">Module ID</label>
                            <Input value={form.module_id} onChange={e => setForm(f => ({...f, module_id: e.target.value}))} placeholder="e.g. cpu" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Field path</label>
                            <Input value={form.field_path} onChange={e => setForm(f => ({...f, field_path: e.target.value}))} placeholder="e.g. temperature" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Operator</label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={form.operator}
                                onChange={e => setForm(f => ({...f, operator: e.target.value}))}
                            >
                                {[">", "<", ">=", "<=", "=="].map(op => <option key={op}>{op}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Threshold</label>
                            <Input type="number" value={form.threshold} onChange={e => setForm(f => ({...f, threshold: parseFloat(e.target.value) || 0}))} />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Severity</label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={form.severity}
                                onChange={e => setForm(f => ({...f, severity: e.target.value}))}
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.module_id || !form.field_path}>
                        <Save className="h-3.5 w-3.5 mr-1.5" />Create rule
                    </Button>
                </div>
            )}

            {isLoading && <Skeleton className="h-12 w-full" />}
            {!isLoading && rules.length === 0 && !showForm && (
                <p className="text-sm text-muted-foreground">No alert rules configured.</p>
            )}
            <div className="space-y-2">
                {rules.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                            <span className="font-mono text-xs">{r.module_id}.{r.field_path}</span>
                            <span className="ml-2 text-muted-foreground">{r.operator} {r.threshold}</span>
                            <span className={`ml-2 text-xs font-medium ${r.severity === "critical" ? "text-red-500" : r.severity === "warning" ? "text-yellow-500" : "text-blue-500"}`}>
                                [{r.severity}]
                            </span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => deleteMutation.mutate(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StubTab({ label }: { label: string }) {
    return (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>{label} \u2014 coming soon.</p>
        </div>
    );
}

// ── Settings page ──────────────────────────────────────────────────────────

const TABS = [
    { id: "board", label: "Board", icon: Server },
    { id: "versions", label: "Versions", icon: Cpu },
    { id: "account", label: "Account", icon: User },
    { id: "network", label: "Network", icon: Wifi },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data", icon: Database },
    { id: "display", label: "Display", icon: Monitor },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "advanced", label: "Advanced", icon: Wrench },
];

function SettingsContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") ?? "board";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Board, account, and server preferences.</p>
            </div>

            <div className="flex gap-6">
                <Tabs defaultValue={defaultTab} className="flex gap-6 w-full">
                    <div className="w-40 shrink-0">
                        <TabsList className="flex-col h-auto w-full bg-transparent p-0 gap-1">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <TabsTrigger
                                    key={id}
                                    value={id}
                                    className="w-full justify-start gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="flex-1 min-w-0">
                        <TabsContent value="board"><Card><CardContent className="pt-6"><BoardTab /></CardContent></Card></TabsContent>
                        <TabsContent value="versions"><Card><CardContent className="pt-6"><VersionsTab /></CardContent></Card></TabsContent>
                        <TabsContent value="account"><Card><CardContent className="pt-6"><AccountTab /></CardContent></Card></TabsContent>
                        <TabsContent value="network"><Card><CardContent className="pt-6"><NetworkTab /></CardContent></Card></TabsContent>
                        <TabsContent value="notifications"><Card><CardContent className="pt-6"><StubTab label="Notification preferences" /></CardContent></Card></TabsContent>
                        <TabsContent value="data"><Card><CardContent className="pt-6"><DataTab /></CardContent></Card></TabsContent>
                        <TabsContent value="display"><Card><CardContent className="pt-6"><StubTab label="Display preferences" /></CardContent></Card></TabsContent>
                        <TabsContent value="alerts"><Card><CardContent className="pt-6"><AlertsTab /></CardContent></Card></TabsContent>
                        <TabsContent value="advanced"><Card><CardContent className="pt-6"><StubTab label="Advanced settings and audit log" /></CardContent></Card></TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <SettingsContent />
        </Suspense>
    );
}
