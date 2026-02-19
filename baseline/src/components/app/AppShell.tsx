"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAppStore } from "@/stores/appStore";
import { AppNavbar } from "./AppNavbar";
import { AppFooter } from "./AppFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { syncComplete } = useSupabaseSync();
  const { company, isOnboardingComplete } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const isOnboardingRoute = pathname?.startsWith("/onboarding");

  // After sync, redirect un-onboarded users to /onboarding
  useEffect(() => {
    if (!syncComplete || isOnboardingRoute) return;
    if (!company && !isOnboardingComplete) {
      router.replace("/onboarding");
    }
  }, [syncComplete, company, isOnboardingComplete, isOnboardingRoute, router]);

  return (
    <AuthGuard>
      {/* Show loading while waiting for Supabase sync on fresh browsers */}
      {!syncComplete && !company ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <AppNavbar />
          <div className="flex flex-col min-h-screen md:ml-64">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
              {children}
            </main>
            <AppFooter />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
