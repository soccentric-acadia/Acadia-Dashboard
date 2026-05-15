"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useBoard } from "@/lib/board/context";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Server, Moon, Sun, Monitor, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageVariants } from "@/components/motion/presets";
import {
  useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule,
  useRetentionSettings, useUpdateRetentionSettings,
  useUpdateBoard, useDeleteBoard, useChangePassword,
} from "@/lib/api/queries";
import { toast } from "sonner";
import type { CreateAlertInput } from "@/lib/api/client";

export default function SettingsPage() {
  const { board } = useBoard();
  const { theme, setTheme } = useTheme();

  // ── Alert rules ──────────────────────────────────────────────────────────
  const { data: alertRules = [] } = useAlertRules();
  const createAlert = useCreateAlertRule();
  const updateAlert = useUpdateAlertRule();
  const deleteAlert = useDeleteAlertRule();
  const [alertForm, setAlertForm] = React.useState<CreateAlertInput>({
    module_id: "", field_path: "", operator: ">", threshold: 0, severity: "warning",
  });

  const onCreateAlert = async () => {
    if (!alertForm.module_id || !alertForm.field_path) { toast.error("Module and field are required"); return; }
    try {
      await createAlert.mutateAsync(alertForm);
      setAlertForm({ module_id: "", field_path: "", operator: ">", threshold: 0, severity: "warning" });
      toast.success("Alert rule created");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  // ── Retention ────────────────────────────────────────────────────────────
  const { data: retention } = useRetentionSettings();
  const updateRetention = useUpdateRetentionSettings();
  const [retDays, setRetDays] = React.useState<string>("");
  const [retMax, setRetMax] = React.useState<string>("");
  React.useEffect(() => {
    if (retention) {
      setRetDays(String(retention.retention_days));
      setRetMax(String(retention.max_run_results));
    }
  }, [retention]);

  const onSaveRetention = async () => {
    try {
      await updateRetention.mutateAsync({ retention_days: Number(retDays), max_run_results: Number(retMax) });
      toast.success("Retention settings saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  // ── Board update/delete ──────────────────────────────────────────────────
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const [boardName, setBoardName] = React.useState(board?.name ?? "");
  React.useEffect(() => { if (board) setBoardName(board.name); }, [board]);

  const onUpdateBoard = async () => {
    if (!boardName.trim()) return;
    try {
      await updateBoard.mutateAsync({ name: boardName.trim() });
      toast.success("Board updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const onDeleteBoard = async () => {
    if (!window.confirm("Remove this board? This will not delete existing run data.")) return;
    try {
      await deleteBoard.mutateAsync();
      toast.success("Board removed");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const changePassword = useChangePassword();
  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");

  const onChangePassword = async () => {
    if (!oldPass || !newPass) { toast.error("Both fields required"); return; }
    try {
      await changePassword.mutateAsync({ old_password: oldPass, new_password: newPass });
      setOldPass(""); setNewPass("");
      toast.success("Password changed");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Dashboard preferences and board configuration</p>
      </div>

      <SectionCard title="Board">
        {board ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="board-name">Name</Label>
              <div className="flex gap-2">
                <Input id="board-name" value={boardName} onChange={(e) => setBoardName(e.target.value)} className="h-8 text-sm" />
                <Button size="sm" className="h-8 text-xs" onClick={onUpdateBoard} disabled={updateBoard.isPending}>Save</Button>
              </div>
            </div>
            {[
              { label: "Hostname", value: board.hostname },
              { label: "Model", value: board.model ?? "—" },
              { label: "Status", value: <Badge variant={board.status === "online" ? "default" : "secondary"} className="capitalize text-xs">{board.status}</Badge> },
              { label: "ID", value: <span className="font-mono text-xs">{board.id}</span> },
              { label: "HAL", value: <span className="font-mono text-xs">{board.hal_version}</span> },
              { label: "Client", value: <span className="font-mono text-xs">{board.client_version}</span> },
              { label: "OS", value: <span className="font-mono text-xs">{board.os_version}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm py-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="destructive" size="sm" className="h-8 text-xs gap-1.5" onClick={onDeleteBoard} disabled={deleteBoard.isPending}>
                <Trash2 className="h-3.5 w-3.5" /> Remove board
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Server className="h-4 w-4" /> No board connected
          </div>
        )}
      </SectionCard>

      <SectionCard title="Appearance">
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Theme</Label>
          <div className="flex gap-2">
            {[
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </Button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data Retention">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ret-days">Retention days (0 = keep forever)</Label>
            <Input id="ret-days" type="number" min="0" value={retDays} onChange={(e) => setRetDays(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ret-max">Max results per run (0 = unlimited)</Label>
            <Input id="ret-max" type="number" min="0" value={retMax} onChange={(e) => setRetMax(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="pt-3">
          <Button size="sm" className="h-8 text-xs" onClick={onSaveRetention} disabled={updateRetention.isPending}>Save retention</Button>
        </div>
      </SectionCard>

      <SectionCard title="Alert Rules">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5 mb-3">
          <Input placeholder="module_id" value={alertForm.module_id} onChange={(e) => setAlertForm((f) => ({ ...f, module_id: e.target.value }))} className="h-8 text-xs" />
          <Input placeholder="field_path (e.g. metrics.temp)" value={alertForm.field_path} onChange={(e) => setAlertForm((f) => ({ ...f, field_path: e.target.value }))} className="h-8 text-xs" />
          <Select value={alertForm.operator} onValueChange={(v) => setAlertForm((f) => ({ ...f, operator: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {([">", "<", ">=", "<=", "=="] as const).map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="threshold" value={alertForm.threshold} onChange={(e) => setAlertForm((f) => ({ ...f, threshold: Number(e.target.value) }))} className="h-8 text-xs" />
          <Select value={alertForm.severity} onValueChange={(v) => setAlertForm((f) => ({ ...f, severity: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["info", "warning", "critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 mb-4" onClick={onCreateAlert} disabled={createAlert.isPending}>
          <Plus className="h-3.5 w-3.5" /> Add rule
        </Button>
        {alertRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alert rules configured</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left">Module</th>
                  <th className="px-3 py-2 text-left">Field</th>
                  <th className="px-3 py-2 text-left">Condition</th>
                  <th className="px-3 py-2 text-left">Severity</th>
                  <th className="px-3 py-2 text-left">Enabled</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {alertRules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5 font-mono">{rule.module_id}</td>
                    <td className="px-3 py-1.5 font-mono">{rule.field_path}</td>
                    <td className="px-3 py-1.5">{rule.operator} {rule.threshold}</td>
                    <td className="px-3 py-1.5"><Badge variant="outline">{rule.severity}</Badge></td>
                    <td className="px-3 py-1.5">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) =>
                          updateAlert.mutate({ id: rule.id, input: { enabled: checked } })
                        }
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        aria-label="Delete alert rule"
                        onClick={() => deleteAlert.mutate(rule.id, { onSuccess: () => toast.success("Rule deleted"), onError: (e: Error) => toast.error(e.message) })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Security">
        <div className="space-y-3 max-w-xs">
          <div className="space-y-1.5">
            <Label htmlFor="old-pass">Current password</Label>
            <Input id="old-pass" type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">New password</Label>
            <Input id="new-pass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="h-8 text-sm" />
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={onChangePassword} disabled={changePassword.isPending}>Change password</Button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
