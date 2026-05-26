import { siteConfig } from "@/shared/config/site";

export interface SharePayload {
  title: string;
  text?: string;
  url: string;
}

export type ShareChannel = "native" | "whatsapp" | "clipboard";

export interface ShareEvent {
  channel: ShareChannel;
  contentType: "listing" | "portfolio";
  slug: string;
  timestamp: number;
}

export function buildListingUrl(slug: string): string {
  return `${siteConfig.url}/listings/${slug}`;
}

export function buildCreativeUrl(slug: string): string {
  return `${siteConfig.url}/creatives/${slug}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildListingShareText(title: string, slug: string): string {
  const url = buildListingUrl(slug);
  return `Check out "${title}" on ${siteConfig.name} — ${url}`;
}

export function buildCreativeShareText(
  displayName: string,
  slug: string
): string {
  const url = buildCreativeUrl(slug);
  return `Check out ${displayName} on ${siteConfig.name} — ${url}`;
}

export function canNativeShare(): boolean {
  if (typeof window === "undefined") return false;
  return !!navigator.share;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

export async function triggerNativeShare(payload: SharePayload): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return false;
    }
    return false;
  }
}

/**
 * Prepare a ShareEvent for future analytics instrumentation.
 * Currently a no-op — returns the event shape for tracking readiness.
 */
export function createShareEvent(
  channel: ShareChannel,
  contentType: "listing" | "portfolio",
  slug: string
): ShareEvent {
  return {
    channel,
    contentType,
    slug,
    timestamp: Date.now(),
  };
}
