"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import { CookieConsent } from '@/components/CookieConsent';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <CookieConsent />
    </AuthProvider>
  );
}
