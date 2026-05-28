import clsx from "clsx";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    destructive: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    outline: "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
};

export function Badge({
    className,
    variant = "default",
    ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
    return (
        <span
            className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variantClasses[variant], className)}
            {...props}
        />
    );
}