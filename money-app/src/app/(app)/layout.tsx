import { AppShell } from "@/components/layout/app-shell";
import { AccessGate } from "@/components/auth/access-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate>
      <AppShell>{children}</AppShell>
    </AccessGate>
  );
}
