import { SidebarModules } from "./sidebar-modules";
import { BoardHeader } from "./board-header";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col overflow-hidden">
            {/* Persistent board header — always visible */}
            <BoardHeader />
            <div className="flex flex-1 overflow-hidden">
                {/* Hardware module inventory sidebar */}
                <SidebarModules />
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Top navigation bar */}
                    <TopNav />
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
