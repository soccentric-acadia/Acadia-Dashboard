/**
 * <CommandPalette> — ⌘K command palette using shadcn Command + cmdk.
 * Opens on Cmd/Ctrl+K or by clicking the trigger button.
 * Destinations include all top-level routes + module search.
 */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard, Play, PlusCircle, BookMarked, CalendarClock,
    ScrollText, FileText, Upload, Settings, HelpCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getModuleRegistry } from "@/lib/proto/registry";
import { getModuleLabel } from "@/lib/utils";
import { ModuleIcon } from "@/components/primitives/module-icon";

const ROUTES = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
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

export interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const { data: modules = [] } = useQuery({
        queryKey: ["modules"],
        queryFn: getModuleRegistry,
        staleTime: Infinity,
    });

    const navigate = (href: string) => {
        onOpenChange(false);
        router.push(href);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search pages, modules, runs…" />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    {ROUTES.map(({ href, label, icon: Icon }) => (
                        <CommandItem
                            key={href}
                            value={label}
                            onSelect={() => navigate(href)}
                            className="gap-2"
                        >
                            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {label}
                        </CommandItem>
                    ))}
                </CommandGroup>

                {modules.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Hardware Modules">
                            {modules.map((mod) => (
                                <CommandItem
                                    key={mod.id}
                                    value={`module ${mod.id} ${getModuleLabel(mod.id)}`}
                                    onSelect={() => navigate(`/modules/${mod.id}`)}
                                    className="gap-2"
                                >
                                    <ModuleIcon moduleId={mod.id} size="sm" className="text-muted-foreground" />
                                    <span>{getModuleLabel(mod.id)}</span>
                                    <span className="ml-auto text-xs font-mono text-muted-foreground/60">{mod.id}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}

/** Keyboard shortcut hook — opens the palette on Cmd/Ctrl+K */
export function useCommandPalette() {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return { open, setOpen };
}
