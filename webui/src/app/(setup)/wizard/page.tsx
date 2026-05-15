"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registerBoard } from "@/lib/api/client";
import { toast } from "sonner";

const STEPS = ["Welcome", "Server", "Board", "Done"];

export default function WizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [boardName, setBoardName] = useState("");
    const [boardModel, setBoardModel] = useState("");
    const [loading, setLoading] = useState(false);

    const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const handleRegister = async () => {
        setLoading(true);
        try {
            await registerBoard({ name: boardName, model: boardModel });
            toast.success("Board registered");
            next();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        {STEPS.map((s, i) => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                        ))}
                    </div>
                    <CardTitle className="text-xl">
                        {step === 0 && "Welcome to Acadia IV&V"}
                        {step === 1 && "Server connection"}
                        {step === 2 && "Register your board"}
                        {step === 3 && "Setup complete"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 0 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                This wizard will help you connect your board and start running validation tests.
                            </p>
                            <Button onClick={next} className="w-full">Get started</Button>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                The Web UI communicates with the Acadia Server over REST.
                                Make sure the server is running and accessible.
                            </p>
                            <div className="rounded-md bg-muted p-3 text-xs font-mono">
                                {process.env.NEXT_PUBLIC_API_BASE ?? "(same origin)"}/api/v1/health
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={prev}>Back</Button>
                                <Button onClick={next}>Continue</Button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Enter details about the board you are validating.
                                The Acadia Client running on the board will connect to this server.
                            </p>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Board name</label>
                                <Input
                                    placeholder="e.g. Raspberry Pi 5 DUT-01"
                                    value={boardName}
                                    onChange={e => setBoardName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Board model</label>
                                <Input
                                    placeholder="e.g. Raspberry Pi 5"
                                    value={boardModel}
                                    onChange={e => setBoardModel(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={prev}>Back</Button>
                                <Button onClick={handleRegister} disabled={loading || !boardName}>
                                    {loading ? "Registering…" : "Register board"}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-center">
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    Setup complete
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your board is registered. Start by creating a run or exploring the module sidebar.
                                </p>
                            </div>
                            <Button className="w-full" onClick={() => router.push("/")}>
                                Go to dashboard
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
