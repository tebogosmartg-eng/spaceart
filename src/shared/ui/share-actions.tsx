"use client";

import { Link2, Share2, MessageCircle } from "lucide-react";
import { useShare } from "@/shared/hooks/use-share";
import { useToast } from "@/shared/ui/toast";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface ShareActionsProps {
  contentType: "listing" | "portfolio";
  slug: string;
  title: string;
  className?: string;
  layout?: "inline" | "stack";
}

export function ShareActions({
  contentType,
  slug,
  title,
  className,
  layout = "inline",
}: ShareActionsProps) {
  const mounted = useMounted();
  const { copyLink, shareNative, shareWhatsApp, canShare, copied } = useShare({
    contentType,
    slug,
    title,
  });
  const { toast } = useToast();

  if (!mounted) return null;

  const handleCopy = async () => {
    await copyLink();
    const label =
      contentType === "listing" ? "Link copied" : "Portfolio link copied";
    toast(label, "success");
  };

  const handleShare = async () => {
    if (canShare) {
      await shareNative();
    } else {
      await handleCopy();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center",
        layout === "inline" ? "gap-2" : "flex-col gap-2",
        className
      )}
    >
      <button
        onClick={handleCopy}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "gap-2 transition-all",
          copied && "border-emerald-500/30 text-emerald-400"
        )}
        aria-label={
          contentType === "listing" ? "Copy listing link" : "Copy portfolio link"
        }
      >
        <Link2 className="size-4" />
        <span className="text-xs sm:text-sm">
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>

      {canShare && (
        <button
          onClick={handleShare}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "gap-2"
          )}
          aria-label="Share"
        >
          <Share2 className="size-4" />
          <span className="text-xs sm:text-sm">Share</span>
        </button>
      )}

      <button
        onClick={shareWhatsApp}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "gap-2 border-[#25D366]/20 text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10"
        )}
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="size-4" />
        <span className="text-xs sm:text-sm">WhatsApp</span>
      </button>
    </div>
  );
}
