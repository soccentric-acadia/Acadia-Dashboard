import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
    default: "bg-sky-600 text-white hover:bg-sky-500",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    outline: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900",
    ghost: "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
    destructive: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Button({
    className,
    variant = "default",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
    return (
        <button
            className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                variantClasses[variant],
                className,
            )}
            {...props}
        />
    );
}