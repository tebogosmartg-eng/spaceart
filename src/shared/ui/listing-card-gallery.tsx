"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ListingCardGalleryImage {
  id: string;
  url: string;
}

interface ListingCardGalleryProps {
  href: string;
  title: string;
  images: ListingCardGalleryImage[];
  priority?: boolean;
}

export function ListingCardGallery({ href, title, images, priority }: ListingCardGalleryProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = images.length;

  const imageCountLabel = useMemo(() => `${activeIndex + 1} / ${total}`, [activeIndex, total]);

  const moveToIndex = useCallback((index: number) => {
    const node = scrollRef.current;
    if (!node) return;
    const clamped = Math.max(0, Math.min(index, total - 1));
    node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
    setActiveIndex(clamped);
  }, [total]);

  const onScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const nextIndex = Math.round(node.scrollLeft / Math.max(node.clientWidth, 1));
    if (nextIndex !== activeIndex) {
      setActiveIndex(Math.max(0, Math.min(nextIndex, total - 1)));
    }
  }, [activeIndex, total]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveToIndex(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveToIndex(activeIndex + 1);
    }
  }, [activeIndex, moveToIndex]);

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden bg-muted/30"
      role="region"
      aria-label={`${title} gallery`}
    >
      <Link
        href={href}
        className="absolute inset-0 z-10"
        aria-label={`Open ${title}`}
      >
        <span className="sr-only">Open {title}</span>
      </Link>

      <div
        ref={scrollRef}
        className={cn(
          "relative z-20 flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={`${title} media preview`}
      >
        {images.map((image, index) => (
          <div key={image.id} className="relative h-full w-full shrink-0 snap-start">
            <Image
              src={image.url}
              alt={`${title} image ${index + 1}`}
              fill
              priority={priority && index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={cn(
              "h-1.5 rounded-full transition-all duration-200",
              index === activeIndex ? "w-4 bg-white/95" : "w-1.5 bg-white/55 hover:bg-white/80"
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveToIndex(index);
            }}
            aria-label={`Show image ${index + 1}`}
            aria-current={index === activeIndex}
          />
        ))}
      </div>

      <p className="absolute right-3 top-3 z-30 rounded-full border border-white/10 bg-background/75 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md">
        {imageCountLabel}
      </p>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          moveToIndex(activeIndex - 1);
        }}
        className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/35 p-1.5 text-white/90 opacity-0 shadow-sm backdrop-blur-sm transition md:block md:group-hover:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          moveToIndex(activeIndex + 1);
        }}
        className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/35 p-1.5 text-white/90 opacity-0 shadow-sm backdrop-blur-sm transition md:block md:group-hover:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
