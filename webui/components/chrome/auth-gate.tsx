"use client";

// components/chrome/auth-gate.tsx — client-side auth guard (DSH-003).
// The workspace is only rendered for a logged-in operator; otherwise the
// browser is sent to /login. The Server enforces auth on every route
// (SRV-001); this gate only provides the navigation UX around it.

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { clearAuthUser, getAuthUser, logout as apiLogout, type AuthUser } from "@/lib/api/auth";

interface AuthGateContextValue {
    user: AuthUser | null;
    setUser: (u: AuthUser | null) => void;
    signOut: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
    const ctx = useContext(AuthGateContext);
    if (!ctx) throw new Error("useAuthGate must be used within AuthGate");
    return ctx;
}

export function AuthGate({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const current = getAuthUser();
        if (!current) {
            router.replace("/login");
            return;
        }
        setUser(current);
        setChecked(true);
    }, [router]);

    async function signOut() {
        try {
            await apiLogout(); // clears the Server session cookie + local state
        } catch {
            clearAuthUser();
        } finally {
            router.replace("/login");
        }
    }

    if (!checked) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
                Checking session…
            </div>
        );
    }

    return (
        <AuthGateContext.Provider value={{ user, setUser, signOut }}>
            {children}
        </AuthGateContext.Provider>
    );
}