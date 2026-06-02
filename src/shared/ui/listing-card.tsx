import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { CreatorTag } from "@/shared/ui/brand";
import type { ListingWithRelations } from "@/shared/types/database";
import { formatPrice, cn } from "@/shared/lib/utils";

interface ListingCardProps {
  listing: ListingWithRelations;
  className?: string;
  priority?: boolean;
}

export function ListingCard({ listing, className, priority }: ListingCardProps) {
  const media = [...(listing.listing_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const imageUrl = media?.url;
  const hasImage = imageUrl?.startsWith("http");
  const creative = listing.creatives;

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-white/8 bg-card shadow-sm transition-brand hover:-translate-y-0.5 hover:border-white/14 hover:shadow-lg hover:shadow-black/30",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt={listing.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-muted to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.categories && (
            <span className="rounded-full border border-white/10 bg-background/75 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
              {listing.categories.name}
            </span>
          )}
          {listing.is_trending && <CreatorTag variant="trending" />}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent">
          {listing.title}
        </h3>
        {creative && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="truncate">{creative.display_name}</span>
            {creative.verified && (
              <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-label="Verified" />
            )}
          </p>
        )}
        <p className="mt-3 text-sm font-medium tabular-nums text-foreground">
          {formatPrice(listing.price_from_cents, listing.price_label)}
        </p>
      </div>
    </Link>
  );
}
