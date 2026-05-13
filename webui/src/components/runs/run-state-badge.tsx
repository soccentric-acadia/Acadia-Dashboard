import { Badge } from "@/components/ui/badge";

const STATE_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
    configured: "outline",
    starting: "warning",
    running: "default",
    paused: "warning",
    stopping: "warning",
    completed: "success",
    failed: "destructive",
    aborted: "secondary",
    unknown: "secondary",
};

export function RunStateBadge({ state }: { state: string }) {
    const variant = STATE_VARIANTS[state] ?? "secondary";
    return (
        <Badge variant={variant} className="capitalize text-xs">
            {state}
        </Badge>
    );
}
