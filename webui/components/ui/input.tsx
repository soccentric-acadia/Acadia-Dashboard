import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={clsx(
                "h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm shadow-sm outline-none ring-sky-400 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950",
                className,
            )}
            {...props}
        />
    );
}