"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Server,
    Boxes,
    Settings2,
    Play,
    ScrollText,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/targets", label: "Targets", icon: Server },
    { href: "/modules", label: "Modules", icon: Boxes },
    { href: "/configs", label: "Configs", icon: Settings2 },
    { href: "/runs", label: "Runs", icon: Play },
    { href: "/logs", label: "Logs", icon: ScrollText },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-56 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-4">
                <span className="font-semibold tracking-tight">Acadia IV&amp;V</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active =
                        href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                active
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                            {active && <ChevronRight className="ml-auto h-3 w-3" />}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
