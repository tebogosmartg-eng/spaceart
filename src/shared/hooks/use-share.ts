"use client";

import { useCallback, useState } from "react";
import {
  copyToClipboard,
  triggerNativeShare,
  canNativeShare,
  buildWhatsAppShareUrl,
  buildListingUrl,
  buildCreativeUrl,
  buildListingShareText,
  buildCreativeShareText,
  createShareEvent,
  type ShareChannel,
} from "@/shared/lib/share";

interface UseShareOptions {
  contentType: "listing" | "portfolio";
  slug: string;
  title: string;
}

interface UseShareReturn {
  copyLink: () => Promise<void>;
  shareNative: () => Promise<void>;
  shareWhatsApp: () => void;
  canShare: boolean;
  copied: boolean;
}

export function useShare({
  contentType,
  slug,
  title,
}: UseShareOptions): UseShareReturn {
  const [copied, setCopied] = useState(false);

  const url =
    contentType === "listing"
      ? buildListingUrl(slug)
      : buildCreativeUrl(slug);

  const shareText =
    contentType === "listing"
      ? buildListingShareText(title, slug)
      : buildCreativeShareText(title, slug);

  const copyLink = useCallback(async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      createShareEvent("clipboard", contentType, slug);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url, contentType, slug]);

  const shareNative = useCallback(async () => {
    const shared = await triggerNativeShare({
      title,
      text: shareText,
      url,
    });
    if (shared) {
      createShareEvent("native", contentType, slug);
    } else {
      await copyLink();
    }
  }, [title, shareText, url, contentType, slug, copyLink]);

  const shareWhatsApp = useCallback(() => {
    createShareEvent("whatsapp", contentType, slug);
    const waUrl = buildWhatsAppShareUrl(shareText);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }, [shareText, contentType, slug]);

  return {
    copyLink,
    shareNative,
    shareWhatsApp,
    canShare: canNativeShare(),
    copied,
  };
}
