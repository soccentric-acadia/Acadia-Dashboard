"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CalendarClock, Play, Pause, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
    id: string;
    name: string;
    type: "one-time" | "recurring";
    expression: string;
    enabled: boolean;
    lastRun: string | null;
    nextRun: string | null;
    status: "pending" | "running" | "completed" | "failed";
}

const MOCK_SCHEDULES: Schedule[] = [];

export default function SchedulesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
                    <p className="text-sm text-muted-foreground mt-1">Automate runs on a schedule.</p>
                </div>
                <Button size="sm" onClick={() => toast.info("Schedule creation coming soon.")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New schedule
                </Button>
            </div>

            {MOCK_SCHEDULES.length === 0 && (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <CalendarClock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No schedules yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create a schedule to automatically run tests at a fixed time or on a recurring basis.
                    </p>
                    <Button className="mt-4" onClick={() => toast.info("Schedule creation coming soon.")}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create schedule
                    </Button>
                </div>
            )}

            <div className="grid gap-3">
                {MOCK_SCHEDULES.map((s) => (
                    <Card key={s.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{s.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{s.type}</Badge>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.expression}</code>
                                    {s.nextRun && (
                                        <span className="text-xs text-muted-foreground">Next: {s.nextRun}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button size="sm" variant="ghost">
                                    {s.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
