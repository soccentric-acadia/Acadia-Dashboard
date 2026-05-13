import { SidebarModules } from "./sidebar-modules";
import { BoardHeader } from "./board-header";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background selection:bg-primary/20 text-foreground">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/5 via-background to-background dark:from-indigo-950/10 -z-10" />
            {/* Persistent board header — always visible */}
            <BoardHeader />
            <div className="flex flex-1 overflow-hidden relative">
                {/* Hardware module inventory sidebar */}
                <SidebarModules />
                <div className="flex flex-1 flex-col overflow-hidden relative border-l border-border/50 shadow-[-10px_0_20px_-15px_rgba(0,0,0,0.1)]">
                    {/* Top navigation bar */}
                    <TopNav />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 xl:p-10">{children}</main>
                </div>
            </div>
        </div>
    );
}
