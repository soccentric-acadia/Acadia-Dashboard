"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Bell, Database, Monitor, Wifi, Wrench, User, Cpu,
    Plus, Trash2, AlertTriangle, Key, Eye, EyeOff, Server,
} from "lucide-react";
import { useBoard } from "@/lib/board/context";
import { useClients } from "@/lib/api/queries";
import { saveCredentials, getSession } from "@/lib/auth/session";
import { toast } from "sonner";

// ── Board Tab ─────────────────────────────────────────────────────────────────

function BoardTab() {
    const { board, setBoard, clearBoard, isLoading } = useBoard();
    const { data: clients } = useClients();
    const [removing, setRemoving] = useState(false);

    if (isLoading) return <Skeleton className="h-40 w-full" />;

    if (!board) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    No board is configured. Select a connected board to manage.
                </p>

                {(!clients || clients.length === 0) && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No boards connected. Make sure the Acadia client is running on your board and the server is reachable.</p>
                    </div>
                )}

                {clients && clients.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Available boards</p>
                        {clients.map((c) => (
                            <div
                                key={c.clientId}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div className="space-y-0.5">
                                    <p className="font-medium text-sm">{c.hostname ?? c.clientId}</p>
                                    <p className="text-xs text-muted-foreground">{c.clientId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={c.isConnected ? "default" : "secondary"}>
                                        {c.isConnected ? "Online" : "Offline"}
                                    </Badge>
                                    <Button size="sm" onClick={() => setBoard(c)}>
                                        Select
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">{board.hostname ?? board.clientId}</p>
                        <p className="text-xs text-muted-foreground">{board.clientId}</p>
                    </div>
                    <Badge variant={board.isConnected ? "default" : "secondary"}>
                        {board.isConnected ? "Online" : "Offline"}
                    </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-muted-foreground text-xs">HAL Version</p>
                        <p>{board.halVersion ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Client Version</p>
                        <p>{board.clientVersion ?? "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">First seen</p>
                        <p>{new Date(board.firstSeen).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">Last seen</p>
                        <p>{new Date(board.lastSeen).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium">Switch board</p>
                {(clients ?? []).filter((c) => c.clientId !== board.clientId).map((c) => (
                    <div key={c.clientId} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="font-medium text-sm">{c.hostname ?? c.clientId}</p>
                            <p className="text-xs text-muted-foreground">{c.clientId}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setBoard(c)}>
                            Switch
                        </Button>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="space-y-2">
                <p className="text-sm font-semibold text-destructive">Remove board</p>
                <p className="text-xs text-muted-foreground">
                    This removes the board selection from this browser. The board stays connected to the server.
                </p>
                {removing ? (
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-sm">Are you sure?</p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { clearBoard(); setRemoving(false); }}
                        >
                            Confirm remove
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRemoving(false)}>Cancel</Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setRemoving(true)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Remove board
                    </Button>
                )}
            </div>
        </div>
    );
}

// ── Account Tab ───────────────────────────────────────────────────────────────

function AccountTab() {
    const session = getSession();
    const [username, setUsername] = useState(session?.username ?? "admin");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);

    const [apiTokens] = useState([
        { id: "tok_1", label: "CLI access", created: "2024-01-15", lastUsed: "2024-03-01" },
    ]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw && newPw !== confirmPw) {
            toast.error("New passwords do not match.");
            return;
        }
        setSaving(true);
        try {
            await saveCredentials(username, newPw || currentPw);
            toast.success("Account updated.");
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
        } catch {
            toast.error("Failed to save credentials.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSave} className="space-y-4">
                <CardTitle className="text-base">Change password</CardTitle>
                <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label>Current password</Label>
                    <div className="relative">
                        <Input
                            type={showPw ? "text" : "password"}
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>New password</Label>
                    <Input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Confirm new password</Label>
                    <Input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </form>

            <Separator />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">API tokens</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Token generation coming soon.")}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Generate
                    </Button>
                </div>
                {apiTokens.map((tok) => (
                    <div key={tok.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                                {tok.label}
                            </p>
                            <p className="text-xs text-muted-foreground">Created {tok.created} · Last used {tok.lastUsed}</p>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => toast.info("Revoke coming soon.")}
                        >
                            Revoke
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Versions Tab ──────────────────────────────────────────────────────────────

function VersionsTab() {
    const { board } = useBoard();
    const items = [
        { label: "HAL", value: board?.halVersion ?? "—" },
        { label: "Client", value: board?.clientVersion ?? "—" },
        { label: "Web UI", value: process.env.NEXT_PUBLIC_VERSION ?? "dev" },
        { label: "Server", value: "—" },
        { label: "OS", value: "—" },
    ];
    return (
        <div className="rounded-lg border divide-y">
            {items.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-mono">{value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Configure when and how you receive notifications.
            </p>
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Notification preferences — coming soon.</p>
            </div>
        </div>
    );
}

// ── Display Tab ───────────────────────────────────────────────────────────────

function DisplayTab() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Theme is controlled by the toggle in the board header. Additional display settings coming soon.
            </p>
        </div>
    );
}

// ── Network Tab ───────────────────────────────────────────────────────────────

function NetworkTab() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
    return (
        <div className="space-y-4">
            <div className="rounded-lg border divide-y">
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Server URL</span>
                    <span className="text-sm font-mono">{base}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">GraphQL endpoint</span>
                    <span className="text-sm font-mono">{base}/graphql</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">WebSocket</span>
                    <span className="text-sm font-mono">{base.replace("http", "ws")}/ws</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                To change the server URL, set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_BASE_URL</code> in your environment.
            </p>
        </div>
    );
}

// ── Advanced Tab ──────────────────────────────────────────────────────────────

function AdvancedTab() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Advanced options and audit log.</p>
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Audit log viewer and advanced settings — coming soon.</p>
            </div>
        </div>
    );
}

// ── Data Tab ──────────────────────────────────────────────────────────────────

function DataTab() {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Data retention and backup settings.</p>
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Retention, backup, and restore — coming soon.</p>
            </div>
        </div>
    );
}

// ── Settings page ─────────────────────────────────────────────────────────────

const TABS = [
    { id: "board", label: "Board", icon: Server },
    { id: "versions", label: "Versions", icon: Cpu },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data", icon: Database },
    { id: "display", label: "Display", icon: Monitor },
    { id: "network", label: "Network", icon: Wifi },
    { id: "advanced", label: "Advanced", icon: Wrench },
];

function SettingsContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") ?? "board";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Board configuration, account management, and preferences.</p>
            </div>

            <div className="flex gap-6">
                <Tabs defaultValue={defaultTab} className="flex gap-6 w-full">
                    {/* Vertical tabs sidebar */}
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

                    {/* Tab content */}
                    <div className="flex-1 min-w-0">
                        <TabsContent value="board"><Card><CardContent className="pt-6"><BoardTab /></CardContent></Card></TabsContent>
                        <TabsContent value="versions"><Card><CardContent className="pt-6"><VersionsTab /></CardContent></Card></TabsContent>
                        <TabsContent value="account"><Card><CardContent className="pt-6"><AccountTab /></CardContent></Card></TabsContent>
                        <TabsContent value="notifications"><Card><CardContent className="pt-6"><NotificationsTab /></CardContent></Card></TabsContent>
                        <TabsContent value="data"><Card><CardContent className="pt-6"><DataTab /></CardContent></Card></TabsContent>
                        <TabsContent value="display"><Card><CardContent className="pt-6"><DisplayTab /></CardContent></Card></TabsContent>
                        <TabsContent value="network"><Card><CardContent className="pt-6"><NetworkTab /></CardContent></Card></TabsContent>
                        <TabsContent value="advanced"><Card><CardContent className="pt-6"><AdvancedTab /></CardContent></Card></TabsContent>
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
