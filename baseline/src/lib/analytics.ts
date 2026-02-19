/**
 * Lightweight analytics utility for tracking user interactions.
 *
 * Currently logs to console in development. Replace the `send` function
 * with your analytics provider (e.g., PostHog, Mixpanel, Segment) when ready.
 */

type EventProperties = Record<string, string | number | boolean | null>;

const COOKIE_CONSENT_KEY = 'eu-cookie-consent';

function isTrackingAllowed(): boolean {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
}

function send(event: string, properties?: EventProperties): void {
  // Replace this with your analytics provider's SDK call
  // e.g., posthog.capture(event, properties)
  // e.g., mixpanel.track(event, properties)
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, properties);
  }
}

export const analytics = {
  /** Track a page view */
  pageView(path: string) {
    if (!isTrackingAllowed()) return;
    send('page_view', { path });
  },

  /** Track a user action */
  track(event: string, properties?: EventProperties) {
    if (!isTrackingAllowed()) return;
    send(event, properties);
  },

  /** Identify a user (call after login) */
  identify(userId: string, traits?: EventProperties) {
    if (!isTrackingAllowed()) return;
    send('identify', { userId, ...traits });
  },
};
