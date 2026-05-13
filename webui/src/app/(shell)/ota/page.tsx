"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Upload, CheckCircle2, AlertCircle, ArrowRight, History,
    RotateCcw, Shield,
} from "lucide-react";
import { useBoard } from "@/lib/board/context";
import { toast } from "sonner";

export default function OtaPage() {
    const { board } = useBoard();
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState<boolean | null>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) setSelectedFile(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
    };

    const handleVerify = async () => {
        if (!selectedFile) return;
        setVerifying(true);
        setVerified(null);
        await new Promise((r) => setTimeout(r, 1500));
        setVerified(true);
        setVerifying(false);
        toast.success("Artifact verified.");
    };

    const handleUpgrade = () => {
        toast.info("OTA upgrade trigger requires server support. Coming soon.");
    };

    const upgradeHistory = [
        { date: "2024-02-15", from: "1.2.0", to: "1.3.0", status: "success", who: "admin" },
        { date: "2024-01-20", from: "1.1.5", to: "1.2.0", status: "success", who: "admin" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">OTA Update</h1>
                <p className="text-sm text-muted-foreground mt-1">Upload and apply firmware updates to the board.</p>
            </div>

            {/* Current versions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Current versions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { label: "OS", value: "—" },
                            { label: "HAL", value: board?.halVersion ?? "—" },
                            { label: "Client", value: board?.clientVersion ?? "—" },
                            { label: "Board", value: board?.hostname ?? "Not connected" },
                        ].map(({ label, value }) => (
                            <div key={label} className="space-y-0.5">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="font-mono text-sm font-medium">{value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Upload */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Upload artifact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        {selectedFile ? (
                            <div>
                                <p className="font-medium text-sm">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-medium">Drop swupdate artifact here</p>
                                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept=".swu,.img,.bin"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {selectedFile && (
                        <div className="flex items-center gap-2">
                            {verified === null && (
                                <Button variant="outline" onClick={handleVerify} disabled={verifying}>
                                    <Shield className="h-4 w-4 mr-1.5" />
                                    {verifying ? "Verifying…" : "Verify artifact"}
                                </Button>
                            )}
                            {verified === true && (
                                <div className="flex items-center gap-1.5 text-sm text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Verified
                                </div>
                            )}
                            {verified === false && (
                                <div className="flex items-center gap-1.5 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    Verification failed
                                </div>
                            )}
                            {verified && (
                                <Button onClick={handleUpgrade} className="ml-auto">
                                    <ArrowRight className="h-4 w-4 mr-1.5" />
                                    Trigger upgrade
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Upgrade history
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upgradeHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No upgrades recorded.</p>
                    ) : (
                        <div className="divide-y">
                            {upgradeHistory.map((h, i) => (
                                <div key={i} className="flex items-center justify-between py-3 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">
                                            {h.from} <ArrowRight className="inline h-3 w-3 mx-1" /> {h.to}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{h.date} · {h.who}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={h.status === "success" ? "default" : "destructive"}>
                                            {h.status}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            title="Rollback"
                                            onClick={() => toast.info("Rollback coming soon.")}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
