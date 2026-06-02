import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/shared/ui/status-badge";
import { formatPrice } from "@/shared/lib/utils";
import type { ListingWithRelations } from "@/shared/types/database";

export function DashboardListingRow({ listing }: { listing: ListingWithRelations }) {
  const media = [...(listing.listing_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const imageUrl = media?.url;
  const hasImage = imageUrl?.startsWith("http");

  return (
    <Link
      href={`/dashboard/listings/${listing.id}/edit`}
      className="group flex items-center gap-4 rounded-xl border border-white/8 bg-card/50 p-3 transition-colors hover:border-white/15 hover:bg-card"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-white/10">
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="64px"
            unoptimized={imageUrl!.includes("cloudinary")}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium group-hover:text-accent">{listing.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatPrice(listing.price_from_cents, listing.price_label)}
        </p>
      </div>
      <StatusBadge status={listing.status} />
    </Link>
  );
}
