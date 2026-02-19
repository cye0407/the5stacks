"use client";

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const COOKIE_CONSENT_KEY = 'eu-cookie-consent';

function getConsentSnapshot() {
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function getServerSnapshot() {
  return 'pending';
}

const subscribe = () => () => {};

export function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getConsentSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const visible = !consent && !dismissed;

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setDismissed(true);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4 sm:p-6 animate-slide-up"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            We use local storage to save your data. Your ESG data never leaves your browser — we don&apos;t
            sell it, share it, or send it to third parties.{' '}
            <Link href="/privacy" className="text-primary underline hover:text-primary-dark">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
