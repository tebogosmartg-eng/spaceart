export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export function trackEvent(_event: AnalyticsEvent): void {
  // Analytics vendor integration deferred post-MVP
}
