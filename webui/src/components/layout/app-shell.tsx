import * as React from "react";
import { SidebarModules } from "./sidebar-modules";
import { TopBar } from "./top-bar";
import { BoardStrip } from "./board-strip";
import { SidebarInset } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
            {/* Hardware module inventory sidebar — mounts its own SidebarProvider */}
            <SidebarModules />

            {/* Main content area — SidebarInset adjusts its left margin based on sidebar state */}
            <SidebarInset className="flex flex-col min-w-0 flex-1 overflow-hidden">
                {/* Horizontal top bar with nav + board chip + user menu */}
                <TopBar />
                {/* 36 px vitals strip: board status, uptime, active run mini-readout */}
                <BoardStrip />
                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 xl:p-10">
                    {children}
                </main>
            </SidebarInset>
        </div>
    );
}
