"use client";
import * as React from "react";
import { motion } from "motion/react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/primitives/section-card";
import { pageVariants } from "@/components/motion/presets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
  useEnableSchedule,
  useDisableSchedule,
  useTemplates,
} from "@/lib/api/queries";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

export default function SchedulesPage() {
  const { data: schedules = [], isLoading } = useSchedules();
  const { data: templates = [] } = useTemplates();
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const enableSchedule = useEnableSchedule();
  const disableSchedule = useDisableSchedule();

  const [templateId, setTemplateId] = React.useState("");
  const [cronExpression, setCronExpression] = React.useState("0 * * * *");

  const onCreate = async () => {
    if (!templateId) {
      toast.error("Choose a template first");
      return;
    }
    if (!cronExpression.trim()) {
      toast.error("Cron expression is required");
      return;
    }
    try {
      await createSchedule.mutateAsync({
        template_id: templateId,
        cron_expression: cronExpression.trim(),
        enabled: true,
      });
      toast.success("Schedule created");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create schedule";
      toast.error(message);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedules</h1>
          <p className="text-sm text-muted-foreground">Automated test run scheduling</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={onCreate} disabled={createSchedule.isPending}>
          <Plus className="h-3.5 w-3.5" />
          New Schedule
        </Button>
      </div>

      <SectionCard title="Create Schedule">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="schedule-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="schedule-template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="schedule-cron">Cron expression</Label>
            <Input
              id="schedule-cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 * * * *"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Upcoming">
        {isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No schedules configured</p>
            <Button variant="outline" size="sm" onClick={onCreate}>Create your first schedule</Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Template</th>
                  <th className="px-4 py-3 text-left font-medium">Cron</th>
                  <th className="px-4 py-3 text-left font-medium">Next run</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const template = templates.find((t) => t.id === schedule.template_id);
                  return (
                    <tr key={schedule.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{template?.name ?? "Unknown template"}</p>
                        <p className="text-xs text-muted-foreground">Created {formatRelativeTime(schedule.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{schedule.cron_expression}</td>
                      <td className="px-4 py-3 text-muted-foreground">{schedule.next_run_at || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={schedule.enabled ? "outline" : "secondary"}>
                          {schedule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={async (checked) => {
                              try {
                                if (checked) {
                                  await enableSchedule.mutateAsync(schedule.id);
                                } else {
                                  await disableSchedule.mutateAsync(schedule.id);
                                }
                              } catch (e) {
                                const message = e instanceof Error ? e.message : "Failed to update schedule";
                                toast.error(message);
                              }
                            }}
                            aria-label="Enable schedule"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              try {
                                await deleteSchedule.mutateAsync(schedule.id);
                                toast.success("Schedule deleted");
                              } catch (e) {
                                const message = e instanceof Error ? e.message : "Failed to delete schedule";
                                toast.error(message);
                              }
                            }}
                            aria-label="Delete schedule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
