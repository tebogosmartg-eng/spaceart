import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { CreatorTag } from "@/shared/ui/brand";
import type { Creative } from "@/shared/types/database";
import { cn } from "@/shared/lib/utils";

interface CreativeCardProps {
  creative: Creative;
  variant?: "default" | "featured";
  className?: string;
  priority?: boolean;
}

export function CreativeCard({
  creative,
  variant = "default",
  className,
  priority,
}: CreativeCardProps) {
  const imageUrl = creative.cover_image_url ?? creative.avatar_url;
  const hasImage = imageUrl?.startsWith("http");

  return (
    <Link
      href={`/creatives/${creative.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/8 bg-card shadow-sm transition-brand hover:-translate-y-1 hover:border-accent/25 hover:shadow-lg hover:shadow-black/30",
        variant === "featured" ? "aspect-[4/5]" : "aspect-[3/4]",
        className
      )}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/25 to-transparent" />
      {hasImage ? (
        <Image
          src={imageUrl!}
          alt={creative.display_name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes={variant === "featured" ? "(max-width:768px) 50vw, 400px" : "(max-width:768px) 50vw, 300px"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-muted/80 to-background" />
      )}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-6">
        <div className="flex items-start gap-2">
          <p className="font-heading text-xl font-semibold leading-tight tracking-tight md:text-2xl">
            {creative.display_name}
          </p>
          {creative.verified && (
            <BadgeCheck
              className="mt-1 size-5 shrink-0 text-accent"
              aria-label="Verified creative"
            />
          )}
        </div>
        {(creative.city || creative.province) && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {[creative.city, creative.province].filter(Boolean).join(", ")}
          </p>
        )}
        {creative.is_featured && (
          <span className="mt-3 inline-block">
            <CreatorTag variant="featured" />
          </span>
        )}
      </div>
    </Link>
  );
}
