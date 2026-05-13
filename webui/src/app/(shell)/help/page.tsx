import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Keyboard, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

const SHORTCUTS = [
    { keys: "G D", action: "Go to Dashboard" },
    { keys: "G R", action: "Go to Runs" },
    { keys: "G N", action: "New Run" },
    { keys: "G S", action: "Go to Settings" },
    { keys: "G L", action: "Go to Logs" },
    { keys: "?", action: "Show this help" },
];

const MODULE_DOCS: Array<{ id: string; name: string; url: string }> = [];

export default function HelpPage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Help</h1>
                <p className="text-sm text-muted-foreground mt-1">Documentation, shortcuts, and getting started guides.</p>
            </div>

            {/* Getting started */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Getting started
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Go to <Link href="/settings" className="text-primary hover:underline">Settings → Board</Link> and select your connected board.</li>
                        <li>The sidebar will populate with the board&#39;s HAL module inventory.</li>
                        <li>Click <Link href="/runs/new" className="text-primary hover:underline">New Run</Link> to start your first test.</li>
                        <li>Monitor live results in the run detail view.</li>
                        <li>Drill into any module&#39;s history via the sidebar.</li>
                    </ol>
                </CardContent>
            </Card>

            {/* Keyboard shortcuts */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Keyboard className="h-4 w-4" />
                        Keyboard shortcuts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {SHORTCUTS.map(({ keys, action }) => (
                            <div key={keys} className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground">{action}</span>
                                <div className="flex items-center gap-1">
                                    {keys.split(" ").map((k) => (
                                        <kbd key={k} className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
                                            {k}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Documentation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                        Per-module documentation links will appear here once they are registered in the module metadata.
                    </p>
                    {MODULE_DOCS.length === 0 && (
                        <p className="text-muted-foreground text-xs">No module docs registered.</p>
                    )}
                    {MODULE_DOCS.map((d) => (
                        <a
                            key={d.id}
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline"
                        >
                            {d.name}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
