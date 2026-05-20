"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, isAuthenticated } from "@/lib/auth/session";
import { useConnectionStore } from "@/state/connection";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Cpu, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const setSimulated = useConnectionStore((s) => s.setSimulated);
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in.
    useEffect(() => {
        if (isAuthenticated()) router.replace("/");
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
            router.replace("/");
        } catch (err) {
            if (err instanceof ApiError && err.isUnauthorized) {
                setError("Invalid username or password.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Cpu className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Acadia IV&amp;V</h1>
                    <p className="text-sm text-muted-foreground">
                        Independent Validation &amp; Verification Dashboard
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to continue.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing in\u2026" : "Sign in"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => { setSimulated(); router.replace("/"); }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                    >
                        Continue in simulated mode →
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground/60">No server required · synthetic data · demo-safe</p>
                </div>
            </div>
        </div>
    );
}
