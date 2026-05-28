import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx("h-px w-full bg-zinc-200 dark:bg-zinc-800", className)} {...props} />;
}