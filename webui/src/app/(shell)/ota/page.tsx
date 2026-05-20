"use client";
import * as React from "react";
import { motion } from "motion/react";
import { useOtaList, useTriggerUpgrade, useRollbackUpgrade } from "@/data";
import { SectionCard } from "@/components/primitives/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { pageVariants } from "@/components/motion/presets";
import { cn } from "@/lib/utils";
import type { OtaUpgrade } from "@/lib/api/types";
import {
  Upload, CheckCircle2, XCircle, RotateCcw, Package, Shield, Hash, FileJson,
  RefreshCw, AlertTriangle, ChevronRight, HardDrive,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  uploaded: "text-muted-foreground",
  pending: "text-yellow-400",
  pushing: "text-blue-400",
  verifying: "text-blue-400",
  rebooting: "text-orange-400",
  completed: "text-status-pass",
  failed: "text-status-fail",
  rolled_back: "text-muted-foreground",
};

const VERIFY_STEPS = [
  { key: "checksum", label: "Checksum", icon: Hash },
  { key: "signature", label: "Signature", icon: Shield },
  { key: "manifest", label: "Manifest", icon: FileJson },
];

function UpgradeStatusBadge({ status }: { status: OtaUpgrade["status"] }) {
  const label = status.replace(/_/g, " ");
  const color = STATUS_COLORS[status] ?? "text-muted-foreground";
  return <span className={cn("font-mono text-[10px]", color)}>{label}</span>;
}

function VerificationCard({ upgrade }: { upgrade: OtaUpgrade | undefined }) {
  const isVerifying = upgrade?.status === "verifying" || upgrade?.status === "pushing";
  const isDone = upgrade?.status === "completed" || upgrade?.status === "rebooting";
  const isFailed = upgrade?.status === "failed";

  return (
    <SectionCard title="Verification">
      <div className="space-y-2">
        {VERIFY_STEPS.map(({ key, label, icon: Icon }, i) => {
          const done = isDone || (isVerifying && i === 0);
          const failed = isFailed && i === 0;
          return (
            <div key={key} className="flex items-center gap-3 text-xs">
              {failed ? (
                <XCircle className="h-4 w-4 text-status-fail shrink-0" />
              ) : done ? (
                <CheckCircle2 className="h-4 w-4 text-status-pass shrink-0" />
              ) : (
                <div className={cn("h-4 w-4 rounded-full border-2 shrink-0", isVerifying ? "border-primary animate-spin border-t-transparent" : "border-border")} />
              )}
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{label}</span>
              {done && <span className="ml-auto text-status-pass text-[10px]">OK</span>}
              {failed && <span className="ml-auto text-status-fail text-[10px]">FAIL</span>}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default function OtaPage() {
  const { data: upgrades = [], isLoading } = useOtaList() as { data: OtaUpgrade[]; isLoading: boolean };
  const trigger = useTriggerUpgrade();
  const rollback = useRollbackUpgrade();

  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const latest = upgrades[0];
  const activeUpgrade = upgrades.find((u) => ["pushing", "verifying", "rebooting", "pending"].includes(u.status));

  async function simulateUpload(file: File) {
    setUploadedFile(file);
    setUploading(true);
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setUploadProgress(i);
    }
    setUploading(false);
    toast.success(`${file.name} uploaded and ready for verification`);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file);
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold">OTA Updates</h1>
          <p className="text-sm text-muted-foreground">Upload and apply firmware upgrades</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Current version card ── */}
          <SectionCard title="Current Firmware">
            <div className="space-y-2">
              {isLoading ? <Skeleton className="h-10" /> : (
                <div className="flex items-center gap-3">
                  <HardDrive className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold font-mono leading-tight">{latest?.from_version ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">installed version</div>
                  </div>
                </div>
              )}
              {latest && (
                <div className="text-xs text-muted-foreground">
                  Last update: <span className="font-mono">{new Date(latest.created_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Upload card ── */}
          <SectionCard title="Upload Firmware">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 gap-3 transition-colors cursor-pointer",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={cn("h-8 w-8", dragOver ? "text-primary" : "text-muted-foreground")} />
              <div className="text-center">
                <div className="text-sm font-medium">{uploadedFile ? uploadedFile.name : "Drop firmware file here"}</div>
                <div className="text-xs text-muted-foreground">or click to browse — .bin, .hex, .tar.gz</div>
              </div>
              {uploading && <Progress value={uploadProgress} className="w-full h-1.5" />}
              <input ref={fileInputRef} type="file" accept=".bin,.hex,.tar.gz,.gz" className="hidden" onChange={handleFileInput} />
            </div>
          </SectionCard>

          {/* ── Verification ── */}
          <VerificationCard upgrade={activeUpgrade ?? latest} />

          {/* ── Diff card ── */}
          {latest && (
            <SectionCard title="Version Diff">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase">Current</div>
                  <div className="font-mono font-semibold text-lg">{latest.from_version}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground uppercase">Target</div>
                  <div className="font-mono font-semibold text-lg text-primary">{latest.to_version}</div>
                </div>
              </div>
              {activeUpgrade && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <UpgradeStatusBadge status={activeUpgrade.status} />
                  </div>
                  <Progress value={activeUpgrade.progress} className="h-1.5" />
                </div>
              )}
              <Separator className="my-3" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full gap-2" disabled={trigger.isPending || !!activeUpgrade || !uploadedFile}>
                    <Package className="h-4 w-4" />{trigger.isPending ? "Applying…" : "Apply Upgrade"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apply firmware upgrade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will push <strong>{latest.to_version}</strong> to the board and reboot. The board will be unavailable for up to 5 minutes during the upgrade.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => trigger.mutate(latest.id, {
                      onSuccess: () => toast.success("Upgrade triggered"),
                      onError: () => toast.error("Failed to trigger upgrade"),
                    })}>Apply Now</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SectionCard>
          )}
        </div>

        {/* ── History table ── */}
        <SectionCard title="Upgrade History">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : upgrades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No upgrade history yet.</p>
          ) : (
            <ScrollArea className="w-full">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {["From", "To", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upgrades.map((u) => (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="py-2 px-2 font-mono">{u.from_version}</td>
                      <td className="py-2 px-2 font-mono">{u.to_version}</td>
                      <td className="py-2 px-2"><UpgradeStatusBadge status={u.status} /></td>
                      <td className="py-2 px-2 text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                      <td className="py-2 px-2">
                        {u.status === "completed" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1">
                                <RotateCcw className="h-3 w-3" /> Rollback
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rollback to {u.from_version}?</AlertDialogTitle>
                                <AlertDialogDescription>The board will reboot to the previous firmware. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => rollback.mutate(u.id, {
                                  onSuccess: () => toast.success("Rollback triggered"),
                                  onError: () => toast.error("Rollback failed"),
                                })}>Rollback Now</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </SectionCard>
      </div>
    </motion.div>
  );
}
