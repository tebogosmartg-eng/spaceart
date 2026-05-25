"use client";

import { WhatsAppButton } from "./whatsapp-button";

interface StickyWhatsAppBarProps {
  phone: string;
  creativeName: string;
  listingTitle?: string;
}

export function StickyWhatsAppBar({
  phone,
  creativeName,
  listingTitle,
}: StickyWhatsAppBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-lg md:hidden">
      <WhatsAppButton
        phone={phone}
        creativeName={creativeName}
        listingTitle={listingTitle}
        size="default"
        className="w-full"
      />
    </div>
  );
}
