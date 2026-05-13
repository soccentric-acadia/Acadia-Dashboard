import { Badge } from "@/components/ui/badge";
import type { RunStatus } from "@/lib/api/types";

const STATUS_VARIANTS: Record<RunStatus, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
    queued:    "outline",
    running:   "default",
    paused:    "warning",
    completed: "success",
    failed:    "destructive",
    cancelled: "secondary",
};

export function RunStateBadge({ state }: { state: RunStatus | string }) {
    const variant = STATUS_VARIANTS[state as RunStatus] ?? "secondary";
    return (
        <Badge variant={variant} className="capitalize text-xs">
            {state}
        </Badge>
    );
}
