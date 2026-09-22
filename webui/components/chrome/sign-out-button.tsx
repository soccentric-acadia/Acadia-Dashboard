"use client";

// components/chrome/sign-out-button.tsx — top-bar logout control (DSH-003).

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/components/chrome/auth-gate";

export function SignOutButton() {
    const { user, signOut } = useAuthGate();

    return (
        <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={signOut}
            title={user ? `Signed in as ${user.username}` : undefined}
        >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign out</span>
        </Button>
    );
}