"use client";

import { Share2 } from "lucide-react";
import { WhatsAppButton } from "./whatsapp-button";
import { useShare } from "@/shared/hooks/use-share";
import { useToast } from "@/shared/ui/toast";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface StickyWhatsAppBarProps {
  phone: string;
  creativeName: string;
  listingTitle?: string;
  slug?: string;
  contentType?: "listing" | "portfolio";
}

export function StickyWhatsAppBar({
  phone,
  creativeName,
  listingTitle,
  slug,
  contentType = "listing",
}: StickyWhatsAppBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2">
        <WhatsAppButton
          phone={phone}
          creativeName={creativeName}
          listingTitle={listingTitle}
          size="default"
          className="flex-1"
        />
        {slug && <StickyShareButton slug={slug} title={listingTitle ?? creativeName} contentType={contentType} />}
      </div>
    </div>
  );
}

function StickyShareButton({
  slug,
  title,
  contentType,
}: {
  slug: string;
  title: string;
  contentType: "listing" | "portfolio";
}) {
  const { shareNative, canShare, copyLink } = useShare({ contentType, slug, title });
  const { toast } = useToast();

  const handlePress = async () => {
    if (canShare) {
      await shareNative();
    } else {
      await copyLink();
      toast("Link copied", "success");
    }
  };

  return (
    <button
      onClick={handlePress}
      className={cn(
        buttonVariants({ variant: "outline", size: "default" }),
        "shrink-0 px-3"
      )}
      aria-label="Share"
    >
      <Share2 className="size-4" />
    </button>
  );
}
