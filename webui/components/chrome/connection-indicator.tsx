"use client";

import { cn } from "@/lib/utils";

export function ConnectionIndicator({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          online ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      <span className={online ? "text-success" : ""}>{online ? "Online" : "Offline"}</span>
    </div>
  );
}
