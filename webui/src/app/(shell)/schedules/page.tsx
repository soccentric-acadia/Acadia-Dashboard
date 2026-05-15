"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus, CalendarClock, Play, Pause, Trash2, AlertCircle,
} from "lucide-react";
import {
    fetchSchedules, enableSchedule, disableSchedule, deleteSchedule,
    type Schedule,
} from "@/lib/api/client";
import { toast } from "sonner";

export default function SchedulesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");

    const { data: schedules = [], isLoading, error } = useQuery<Schedule[]>({
        queryKey: ["schedules"],
        queryFn: fetchSchedules,
    });

    const enableMutation = useMutation({
        mutationFn: (id: string) => enableSchedule(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule enabled"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const disableMutation = useMutation({
        mutationFn: (id: string) => disableSchedule(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule disabled"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSchedule(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Schedule deleted"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const filtered = schedules.filter(
        (s) => s.name.toLowerCase().includes(search.toLowerCase())
    );

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

            <Input
                placeholder="Search schedules…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {isLoading && (
                <div className="space-y-2">
                    {[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load schedules: {(error as Error).message}</span>
                </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
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
                {filtered.map((s) => (
                    <Card key={s.id}>
                        <CardContent className="flex items-center justify-between gap-4 py-4">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{s.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={s.enabled ? "default" : "secondary"} className="text-xs">
                                        {s.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.cron_expr}</code>
                                    <span className="text-xs text-muted-foreground">
                                        Created {new Date(s.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title={s.enabled ? "Disable" : "Enable"}
                                    onClick={() => s.enabled
                                        ? disableMutation.mutate(s.id)
                                        : enableMutation.mutate(s.id)
                                    }
                                >
                                    {s.enabled
                                        ? <Pause className="h-3.5 w-3.5" />
                                        : <Play className="h-3.5 w-3.5" />
                                    }
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title="Delete"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => deleteMutation.mutate(s.id)}
                                >
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
