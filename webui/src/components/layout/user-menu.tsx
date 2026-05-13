"use client";

import { useState, useEffect } from "react";
import { User, LogOut, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser, logout } from "@/lib/auth/session";
import { useRouter } from "next/navigation";

export function UserMenu() {
    const [open, setOpen]         = useState(false);
    const [username, setUsername] = useState("admin");
    const router = useRouter();

    useEffect(() => {
        const s = getSessionUser();
        if (s?.username) setUsername(s.username);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        router.push("/login");
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                aria-label="User menu"
            >
                <User className="h-4 w-4" />
            </Button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-44 rounded-md border bg-popover shadow-md py-1 text-sm">
                        <div className="px-3 py-2 text-muted-foreground text-xs border-b mb-1">
                            {username}
                        </div>
                        <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-sm transition-colors"
                            onClick={() => { setOpen(false); router.push("/settings?tab=account"); }}
                        >
                            <Key className="h-3.5 w-3.5" />
                            Account settings
                        </button>
                        <button
                            className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-accent rounded-sm transition-colors"
                            onClick={() => { setOpen(false); router.push("/settings?tab=advanced"); }}
                        >
                            <Shield className="h-3.5 w-3.5" />
                            Audit log
                        </button>
                        <div className="border-t mt-1 pt-1">
                            <button
                                className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-sm transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
