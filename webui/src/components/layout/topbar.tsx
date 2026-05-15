"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchNotificationCount } from "@/lib/api/client";
import Link from "next/link";

export function Topbar() {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === "system") setTheme("light");
        else if (theme === "light") setTheme("dark");
        else setTheme("system");
    };

    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

    const { data: count = 0 } = useQuery<number>({
        queryKey: ["notification-count"],
        queryFn: fetchNotificationCount,
        refetchInterval: 30_000,
        staleTime: 15_000,
    });

    return (
        <header className="flex h-14 items-center justify-end border-b bg-card px-4 gap-1">
            <Link href="/settings?tab=notifications" passHref>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="h-4 w-4" />
                    {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    )}
                </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
                <Icon className="h-4 w-4" />
            </Button>
        </header>
    );
}
