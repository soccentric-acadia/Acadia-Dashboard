"use client";

// app/login/page.tsx — operator login page (DSH-003).
// POSTs credentials to the Server; the Server sets the session cookie used by
// every subsequent API call.

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { PLATFORM_SLUG } from "@/lib/platform";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(username, password);
            router.replace("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{PLATFORM_SLUG} sign in</CardTitle>
                    <CardDescription>Operator access to the IV&amp;V console</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
                        <Input
                            type="text"
                            name="username"
                            autoComplete="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Signing in…" : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}