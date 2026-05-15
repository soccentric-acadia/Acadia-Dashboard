import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "timeout" | "skipped" | "aborted" | "unknown";
    }
>(({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input",
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        timeout: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        skipped: "bg-muted text-muted-foreground",
        aborted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        unknown: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-dashed border-gray-400",
    };
    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variantClasses[variant],
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };
