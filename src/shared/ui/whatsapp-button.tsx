import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildWhatsAppUrl, cn } from "@/shared/lib/utils";

interface WhatsAppButtonProps {
  phone: string;
  creativeName: string;
  listingTitle?: string;
  className?: string;
  size?: "default" | "lg";
  variant?: "default" | "outline";
}

export function WhatsAppButton({
  phone,
  creativeName,
  listingTitle,
  className,
  size = "lg",
  variant = "default",
}: WhatsAppButtonProps) {
  const message = listingTitle
    ? `Hi ${creativeName}, I found you on SPACEART — interested in "${listingTitle}".`
    : `Hi ${creativeName}, I found you on SPACEART and would love to connect about your work.`;

  const href = buildWhatsAppUrl(phone, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contact ${creativeName} on WhatsApp`}
      className={cn(
        buttonVariants({ size, variant }),
        variant === "default" &&
          "bg-[#25D366] text-white hover:bg-[#20bd5a]",
        className
      )}
    >
      <MessageCircle className="mr-2 size-5" />
      Contact on WhatsApp
    </a>
  );
}
