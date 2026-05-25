import Image from "next/image";
import { MapPin, LayoutGrid } from "lucide-react";
import { CreatorTag } from "@/shared/ui/brand";
import type { Creative } from "@/shared/types/database";
import { WhatsAppButton } from "@/shared/ui/whatsapp-button";
import { cn } from "@/shared/lib/utils";

interface CreativeProfileHeroProps {
  creative: Creative;
  listingCount: number;
}

export function CreativeProfileHero({
  creative,
  listingCount,
}: CreativeProfileHeroProps) {
  const coverUrl = creative.cover_image_url?.startsWith("http")
    ? creative.cover_image_url
    : null;
  const avatarUrl = creative.avatar_url?.startsWith("http")
    ? creative.avatar_url
    : null;
  const heroImage = coverUrl ?? avatarUrl;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-card">
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative px-6 pb-8 pt-0 md:px-10 md:pb-10">
        <div className="-mt-14 flex flex-col gap-6 md:-mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex gap-5">
            <div
              className={cn(
                "relative size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background shadow-xl md:size-28",
                !avatarUrl && "bg-muted"
              )}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={creative.display_name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-accent/20 font-heading text-2xl font-bold text-accent">
                  {creative.display_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 pt-2 md:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-cinematic text-3xl md:text-5xl">
                  {creative.display_name}
                </h1>
                {creative.verified && <CreatorTag variant="verified" />}
              </div>
              {(creative.city || creative.province) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  {[creative.city, creative.province].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <LayoutGrid className="size-3.5" />
                  {listingCount} listing{listingCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {creative.whatsapp_number && (
            <div className="hidden shrink-0 md:block">
              <WhatsAppButton
                phone={creative.whatsapp_number}
                creativeName={creative.display_name}
              />
            </div>
          )}
        </div>

        {creative.bio && (
          <p className="mt-8 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {creative.bio}
          </p>
        )}
      </div>
    </div>
  );
}
