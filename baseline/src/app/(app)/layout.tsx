import { AppShell } from "@/components/app/AppShell";
import PWAInstallPrompt from "@/components/app/PWAInstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <PWAInstallPrompt />
    </>
  );
}
