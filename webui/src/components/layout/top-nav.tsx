"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Play,
    PlusCircle,
    BookMarked,
    CalendarClock,
    ScrollText,
    FileText,
    Upload,
    Settings,
    HelpCircle,
} from "lucide-react";

const NAV = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/runs", label: "Runs", icon: Play },
    { href: "/runs/new", label: "New Run", icon: PlusCircle },
    { href: "/templates", label: "Templates", icon: BookMarked },
    { href: "/schedules", label: "Schedules", icon: CalendarClock },
    { href: "/logs", label: "Logs", icon: ScrollText },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/ota", label: "OTA", icon: Upload },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help", icon: HelpCircle },
];

export function TopNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-0.5 border-b bg-card px-2 overflow-x-auto shrink-0">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                            active
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
