import { AppShell } from "@/components/layout/app-shell";
import { BoardProvider } from "@/lib/board/context";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    return (
        <BoardProvider>
            <AppShell>{children}</AppShell>
        </BoardProvider>
    );
}
