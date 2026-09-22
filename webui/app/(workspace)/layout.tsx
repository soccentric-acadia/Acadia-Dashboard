import { AppShell } from "@/components/chrome/app-shell";
import { AuthGate } from "@/components/chrome/auth-gate";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
