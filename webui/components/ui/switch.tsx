import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export function Switch({
    checked,
    className,
    disabled,
    ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role"> & { checked: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "border-emerald-500 bg-emerald-500" : "border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800",
                className,
            )}
            {...props}
        >
            <span
                className={clsx(
                    "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5",
                )}
            />
        </button>
    );
}
