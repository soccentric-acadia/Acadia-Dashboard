"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

    return (
        <header className="flex h-14 items-center justify-end border-b bg-card px-4">
            <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
                <Icon className="h-4 w-4" />
            </Button>
        </header>
    );
}
