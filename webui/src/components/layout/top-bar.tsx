/**
 * <TopBar> — full horizontal top bar replacing the old sidebar-based nav.
 *
 * Three regions:
 *  Left  — product wordmark + horizontal NavigationMenu + ⌘K trigger
 *  Center — board identity chip (ID, status dot, uptime, active run)
 *  Right  — live run badge, theme toggle, user menu
 *
 * Glows on the bottom border when a run is active.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useBoard } from "@/lib/board/context";
import { useRuns } from "@/lib/api/queries";
import { useHealth } from "@/lib/api/queries";
import { LiveDot } from "@/components/primitives/live-dot";
import { ConnectionPill } from "@/components/primitives/connection-pill";
import { UserMenu } from "@/components/layout/user-menu";
import { CommandPalette, useCommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    LayoutDashboard, Play, PlusCircle, BookMarked, CalendarClock,
    ScrollText, FileText, Upload, Settings, HelpCircle, Search,
    Moon, Sun, Monitor, Cpu, WifiOff, Bell,
} from "lucide-react";
import { useConnectionStore } from "@/state/connection";

const NAV_ITEMS = [
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
] as const;

function NavItem({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
    const pathname = usePathname();
    const active = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                "relative flex items-center px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors rounded-md",
                active
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            )}
            aria-current={active ? "page" : undefined}
        >
            {label}
        </Link>
    );
}

function BoardChip() {
    const { board } = useBoard();
    const { data: health } = useHealth();
    const serverUp = Boolean(health);
    const online = board?.status === "online" && serverUp;
    const router = useRouter();

    if (!board) {
        return (
            <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors cursor-pointer text-xs"
                onClick={() => router.push("/settings")}
                aria-label="No board connected — open Settings"
            >
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">No board</span>
            </button>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors cursor-pointer text-xs font-mono",
                            online
                                ? "bg-status-running-bg border-status-running/30 hover:border-status-running/50"
                                : "bg-secondary/50 border-border/50 hover:bg-secondary",
                        )}
                        onClick={() => router.push("/settings?tab=board")}
                        aria-label={`Board ${board.id} — ${online ? "Online" : "Offline"}`}
                    >
                        <LiveDot state={online ? "running" : "disconnected"} size="xs" />
                        <span className="text-foreground/90 max-w-[140px] truncate">{board.id}</span>
                        {online && (
                            <span className="text-muted-foreground/60 hidden xl:inline">
                                · {board.status}
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-mono text-xs">
                    <div className="space-y-0.5">
                        <div>ID: {board.id}</div>
                        {board.model && <div>Model: {board.model}</div>}
                        {board.os_version && <div>OS: {board.os_version}</div>}
                        {board.hal_version && <div>HAL: {board.hal_version}</div>}
                        <div>Status: {board.status}</div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ActiveRunBadge() {
    const { data } = useRuns({ status: "running", limit: 1 });
    const active = data?.runs?.[0];
    if (!active) return null;

    return (
        <Link
            href={`/runs/${active.id}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-running-bg border border-status-running/30 text-xs text-status-running-fg hover:bg-status-running-bg/80 transition-colors"
            aria-label={`Active run: ${active.name || active.id}`}
        >
            <LiveDot state="running" size="xs" />
            <span className="font-medium truncate max-w-[10rem]">
                {active.name || active.id.slice(0, 12)}
            </span>
        </Link>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    if (!mounted) return <Button variant="ghost" size="icon" className="h-8 w-8" />;

    const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme">
                    <Icon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function TopBar() {
    const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
    const { data: activeRuns } = useRuns({ status: "running", limit: 1 });
    const hasActiveRun = (activeRuns?.runs?.length ?? 0) > 0;
    const connectionState = useConnectionStore((s) => s.state);
    const setSimulated = useConnectionStore((s) => s.setSimulated);
    const setLive = useConnectionStore((s) => s.setLive);

    return (
        <>
            <header
                className={cn(
                    "flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-sm px-3 z-40 sticky top-0",
                    hasActiveRun
                        ? "border-b-status-running/40 shadow-glow-run animate-live-glow motion-reduce:animate-none"
                        : "border-border/60",
                )}
            >
                {/* ── Left: Wordmark + Nav ─────────────────────────────────────── */}
                <div className="flex items-center gap-1 shrink-0 min-w-0 overflow-hidden">
                    {/* Wordmark */}
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 mr-2 shrink-0"
                        aria-label="Acadia IV&V — home"
                    >
                        <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span className="font-mono font-semibold text-sm tracking-tight">
                            ACADIA
                        </span>
                    </Link>

                    {/* Navigation — horizontal, scrollable on small screens */}
                    <nav
                        className="flex items-center gap-0.5 overflow-x-auto scrollbar-none"
                        aria-label="Main navigation"
                    >
                        {NAV_ITEMS.map((item) => (
                            <NavItem key={item.href} href={item.href} label={item.label} exact={"exact" in item ? item.exact : undefined} />
                        ))}
                    </nav>
                </div>

                {/* ── Center: Board chip ───────────────────────────────────────── */}
                <div className="flex items-center justify-center gap-3 shrink-0">
                    <BoardChip />
                    <ActiveRunBadge />
                </div>

                {/* ── Right: ⌘K + connection pill + theme + bell + user ─────── */}
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hidden md:flex"
                        onClick={() => setPaletteOpen(true)}
                        aria-label="Open command palette (⌘K)"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/70 bg-muted px-1 py-0.5 font-mono text-[10px]">
                            <span>⌘</span>K
                        </kbd>
                    </Button>
                    <ConnectionPill
                        state={connectionState}
                        onSwitchToLive={setLive}
                        onSwitchToSimulated={setSimulated}
                    />
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notifications">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <UserMenu />
                </div>
            </header>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </>
    );
}
