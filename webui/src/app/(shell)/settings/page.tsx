"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useBoard } from "@/lib/board/context";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Server, Moon, Sun, Monitor, Trash2, Plus, Network, Bell, Database, Eye, Cpu, User, Settings, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageVariants } from "@/components/motion/presets";
import {
  useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule,
  useRetentionSettings, useUpdateRetentionSettings,
  useUpdateBoard, useDeleteBoard, useChangePassword,
  useConnectionStore, useIsSimulated,
} from "@/data";
import { toast } from "sonner";
import type { CreateAlertInput } from "@/lib/api/client";

export default function SettingsPage() {
  const { board } = useBoard();
  const { theme, setTheme } = useTheme();
  const isSimMode = useIsSimulated();
  const connMode = useConnectionStore((s) => s.state);
  const setSimulated = useConnectionStore((s) => s.setSimulated);
  const setLive = useConnectionStore((s) => s.setLive);

  // Alert rules
  const { data: alertRules = [] } = useAlertRules();
  const createAlert = useCreateAlertRule();
  const updateAlert = useUpdateAlertRule();
  const deleteAlert = useDeleteAlertRule();

  const [newAlertName, setNewAlertName] = React.useState("");
  const [newAlertField, setNewAlertField] = React.useState("");
  const [newAlertOp, setNewAlertOp] = React.useState("gt");
  const [newAlertValue, setNewAlertValue] = React.useState("");

  // Retention
  const { data: retention } = useRetentionSettings();
  const updateRetention = useUpdateRetentionSettings();
  const [retentionDays, setRetentionDays] = React.useState<number>(90);
  React.useEffect(() => { if (retention?.days) setRetentionDays(retention.days); }, [retention]);

  // Board
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const [boardName, setBoardName] = React.useState(board?.name ?? "");
  React.useEffect(() => { if (board?.name) setBoardName(board.name); }, [board]);

  // Account
  const changePassword = useChangePassword();
  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [newPass2, setNewPass2] = React.useState("");

  // Network
  const [apiUrl, setApiUrl] = React.useState(() => typeof window !== "undefined" ? (localStorage.getItem("acadia_api_url") ?? "") : "");

  async function saveApiUrl() {
    localStorage.setItem("acadia_api_url", apiUrl);
    toast.success("API URL saved — refresh to reconnect");
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure the dashboard and board connection</p>
        </div>

        <Tabs defaultValue="board">
          <TabsList className="flex-wrap h-auto gap-0.5 mb-4">
            <TabsTrigger value="board" className="gap-1.5 text-xs"><Cpu className="h-3.5 w-3.5" />Board</TabsTrigger>
            <TabsTrigger value="connection" className="gap-1.5 text-xs"><Server className="h-3.5 w-3.5" />Connection</TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" />Account</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs"><Database className="h-3.5 w-3.5" />Data</TabsTrigger>
            <TabsTrigger value="display" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Display</TabsTrigger>
            <TabsTrigger value="network" className="gap-1.5 text-xs"><Network className="h-3.5 w-3.5" />Network</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" />Advanced</TabsTrigger>
          </TabsList>

          {/* ── Board ── */}
          <TabsContent value="board">
            <SectionCard title="Board Identity">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between gap-2 rounded bg-muted/30 px-2 py-1"><span className="text-muted-foreground">Board ID</span><span className="font-mono">{board?.id ?? "—"}</span></div>
                  <div className="flex justify-between gap-2 rounded bg-muted/30 px-2 py-1"><span className="text-muted-foreground">Type</span><span className="font-mono">{board?.board_type ?? "—"}</span></div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Display name</Label>
                  <div className="flex gap-2">
                    <Input value={boardName} onChange={(e) => setBoardName(e.target.value)} className="font-mono" />
                    <Button size="sm" onClick={() => updateBoard.mutate({ name: boardName }, { onSuccess: () => toast.success("Board name updated") })}>Save</Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Connection ── */}
          <TabsContent value="connection">
            <div className="space-y-4">
              <SectionCard title="Connection Mode">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Current mode</div>
                      <div className="text-xs text-muted-foreground">How the dashboard connects to the hardware</div>
                    </div>
                    <Badge variant={isSimMode ? "outline" : "default"} className={isSimMode ? "border-purple-500/40 text-purple-400" : ""}>
                      {connMode}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">Simulated mode</div>
                      <p className="text-xs text-muted-foreground">Use synthetic data — no hardware required</p>
                    </div>
                    <Switch checked={isSimMode} onCheckedChange={(v) => { if (v) setSimulated(); else setLive?.(); }} />
                  </div>
                  {isSimMode && (
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                        <FlaskConical className="h-3.5 w-3.5" /> Simulation Options
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Profile</Label>
                          <Select defaultValue="nominal">
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nominal">Nominal</SelectItem>
                              <SelectItem value="stress">Stress</SelectItem>
                              <SelectItem value="degraded">Degraded</SelectItem>
                              <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Seed (deterministic)</Label>
                          <Input placeholder="e.g. 42" className="h-7 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── Account ── */}
          <TabsContent value="account">
            <SectionCard title="Change Password">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current password</Label>
                  <Input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} autoComplete="current-password" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New password</Label>
                  <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm new password</Label>
                  <Input type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} autoComplete="new-password" />
                </div>
                {newPass && newPass !== newPass2 && <p className="text-xs text-status-fail">Passwords do not match</p>}
                <Button size="sm" disabled={!oldPass || !newPass || newPass !== newPass2 || changePassword.isPending}
                  onClick={() => changePassword.mutate({ old_password: oldPass, new_password: newPass }, {
                    onSuccess: () => { toast.success("Password changed"); setOldPass(""); setNewPass(""); setNewPass2(""); },
                    onError: () => toast.error("Failed to change password"),
                  })}>
                  {changePassword.isPending ? "Changing…" : "Change Password"}
                </Button>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications">
            <div className="space-y-4">
              <SectionCard title="Alert Rules">
                <div className="space-y-3">
                  {alertRules.length === 0 && <p className="text-xs text-muted-foreground">No alert rules configured.</p>}
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-xs">
                      <Switch checked={rule.enabled} onCheckedChange={(v) => updateAlert.mutate({ id: rule.id, enabled: v })} />
                      <span className="font-medium">{rule.name}</span>
                      <span className="text-muted-foreground font-mono">{rule.field} {rule.operator} {rule.threshold}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => deleteAlert.mutate(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Rule name" value={newAlertName} onChange={(e) => setNewAlertName(e.target.value)} className="h-7 text-xs" />
                    <Input placeholder="field (e.g. temperature)" value={newAlertField} onChange={(e) => setNewAlertField(e.target.value)} className="h-7 text-xs font-mono" />
                    <Select value={newAlertOp} onValueChange={setNewAlertOp}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["gt", "lt", "gte", "lte", "eq", "neq"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="threshold value" value={newAlertValue} onChange={(e) => setNewAlertValue(e.target.value)} className="h-7 text-xs font-mono" />
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5"
                    disabled={!newAlertName || !newAlertField || !newAlertValue}
                    onClick={() => createAlert.mutate({
                      name: newAlertName, field: newAlertField, operator: newAlertOp, threshold: parseFloat(newAlertValue), enabled: true,
                    } as CreateAlertInput, {
                      onSuccess: () => { toast.success("Alert rule created"); setNewAlertName(""); setNewAlertField(""); setNewAlertValue(""); },
                    })}>
                    <Plus className="h-3.5 w-3.5" /> Add Rule
                  </Button>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── Data ── */}
          <TabsContent value="data">
            <SectionCard title="Data Retention">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground shrink-0">Retain results for</Label>
                  <Input type="number" min={1} max={3650} value={retentionDays} onChange={(e) => setRetentionDays(parseInt(e.target.value) || 90)} className="h-7 w-20 font-mono text-xs" />
                  <span className="text-xs text-muted-foreground">days</span>
                  <Button size="sm" variant="outline" onClick={() => updateRetention.mutate({ days: retentionDays }, { onSuccess: () => toast.success("Retention updated") })}>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground">Results older than this threshold are automatically purged from the board database.</p>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Display ── */}
          <TabsContent value="display">
            <SectionCard title="Theme">
              <div className="flex gap-2">
                {[{ value: "light", icon: Sun, label: "Light" }, { value: "dark", icon: Moon, label: "Dark" }, { value: "system", icon: Monitor, label: "System" }].map(({ value, icon: Icon, label }) => (
                  <button key={value} type="button" onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-xs transition-colors hover:border-primary/60 ${theme === value ? "border-primary bg-primary/5" : "border-border"}`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Network ── */}
          <TabsContent value="network">
            <SectionCard title="API Endpoint">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Board API URL</Label>
                  <div className="flex gap-2">
                    <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://board.local:8080" className="font-mono" />
                    <Button size="sm" onClick={saveApiUrl}>Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Override the API base URL. Leave empty to use the default configured at build time.</p>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Advanced ── */}
          <TabsContent value="advanced">
            <div className="space-y-4">
              <SectionCard title="Danger Zone">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-destructive">Delete Board</div>
                      <p className="text-xs text-muted-foreground">Permanently remove this board and all its data</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this board and all data? This cannot be undone.")) { deleteBoard.mutate(undefined, { onSuccess: () => toast.success("Board deleted") }); } }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Board
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
