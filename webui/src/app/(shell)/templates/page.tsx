"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

import { motion } from "motion/react";
import { SectionCard } from "@/components/primitives/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileCode, Archive, Trash2, Copy } from "lucide-react";
import { pageVariants } from "@/components/motion/presets";
import {
  useTemplates,
  useCreateTemplate,
  useArchiveTemplate,
  useDeleteTemplate,
  useInstantiateTemplate,
  useCreateConfig,
} from "@/lib/api/queries";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import type { TestMode } from "@/lib/api/types";

const MODE_OPTIONS: Array<{ value: TestMode; label: string }> = [
  { value: "single_shot", label: "Single Shot" },
  { value: "long_term", label: "Long Term" },
  { value: "monitoring", label: "Monitoring" },
  { value: "event_based", label: "Event Based" },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const archiveTemplate = useArchiveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const instantiateTemplate = useInstantiateTemplate();
  const createConfig = useCreateConfig();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mode, setMode] = React.useState<TestMode>("single_shot");

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        mode,
        common_config: {},
        modules: [],
      });
      setName("");
      setDescription("");
      setMode("single_shot");
      toast.success("Template created");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create template";
      toast.error(message);
    }
  };

  const onInstantiate = async (templateId: string, templateName: string) => {
    try {
      const draft = await instantiateTemplate.mutateAsync(templateId);
      const parsed = JSON.parse(draft.config_json || "{}") as Record<string, unknown>;
      const created = await createConfig.mutateAsync({
        name: `${templateName} - copy`,
        description: "Created from template",
        mode: (parsed.mode as TestMode) ?? "single_shot",
        common_config: (parsed.common_config as Record<string, unknown>) ?? {},
        modules: (parsed.modules as Array<{ id: string; enabled: boolean; config_payload: Record<string, unknown>; notes: string }>) ?? [],
      });
      toast.success("Template instantiated as config draft");
      router.push(`/configs/${created.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to instantiate template";
      toast.error(message);
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable run configurations and test suites</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={onCreate} disabled={createTemplate.isPending}>
          <Plus className="h-3.5 w-3.5" />
          New Template
        </Button>
      </div>

      <SectionCard title="Create Template">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Burn-in baseline"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-mode">Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as TestMode)}>
              <SelectTrigger id="template-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-description">Description</Label>
            <Input
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Saved Templates">
        {isLoading ? (
          <p className="py-6 text-sm text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileCode className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No templates saved yet</p>
            <p className="text-xs text-muted-foreground">Templates let you quickly re-run a set of modules with the same configuration</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">State</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{template.name}</p>
                      {template.description ? (
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{template.mode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(template.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={template.is_archived ? "secondary" : "outline"}>
                        {template.is_archived ? "Archived" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onInstantiate(template.id, template.name)}
                          aria-label="Instantiate template"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={template.is_archived || archiveTemplate.isPending}
                          onClick={async () => {
                            try {
                              await archiveTemplate.mutateAsync(template.id);
                              toast.success("Template archived");
                            } catch (e) {
                              const message = e instanceof Error ? e.message : "Failed to archive template";
                              toast.error(message);
                            }
                          }}
                          aria-label="Archive template"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deleteTemplate.isPending}
                          onClick={async () => {
                            try {
                              await deleteTemplate.mutateAsync(template.id);
                              toast.success("Template deleted");
                            } catch (e) {
                              const message = e instanceof Error ? e.message : "Failed to delete template";
                              toast.error(message);
                            }
                          }}
                          aria-label="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
