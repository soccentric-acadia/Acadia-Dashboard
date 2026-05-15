"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useOtaList, useTriggerUpgrade, useRollbackUpgrade } from "@/lib/api/queries";
import { SectionCard } from "@/components/primitives/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, RotateCcw } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { pageVariants } from "@/components/motion/presets";

export default function OtaPage() {
  const { data, isLoading } = useOtaList();
  const triggerUpgrade = useTriggerUpgrade();
  const rollbackUpgrade = useRollbackUpgrade();
  const items = (data as { upgrades?: { id: string; version: string; status: string; applied_at?: string }[] })?.upgrades ?? [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">OTA Updates</h1>
        <p className="text-sm text-muted-foreground">Over-the-air firmware management</p>
      </div>
      <SectionCard title="Firmware History">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No firmware updates available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                <div>
                  <div className="text-sm font-medium font-mono">{item.version}</div>
                  {item.applied_at && <div className="text-xs text-muted-foreground">{formatRelativeTime(item.applied_at)}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "applied" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">{item.status}</Badge>
                  {item.status !== "applied" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => triggerUpgrade.mutate(item.id, {
                        onSuccess: () => toast.success("Upgrade triggered"),
                        onError: (e: Error) => toast.error(e.message),
                      })}
                    >
                      <Upload className="h-3 w-3" /> Apply
                    </Button>
                  )}
                  {item.status === "applied" && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground"
                      onClick={() => rollbackUpgrade.mutate(item.id, {
                        onSuccess: () => toast.success("Rolled back"),
                        onError: (e: Error) => toast.error(e.message),
                      })}
                    >
                      <RotateCcw className="h-3 w-3" /> Rollback
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </motion.div>
  );
}
