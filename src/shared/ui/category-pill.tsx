import Link from "next/link";
import {
  Camera,
  Mic,
  Music,
  Palette,
  PenTool,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/shared/types/database";
import { cn } from "@/shared/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  music: Music,
  shirt: Shirt,
  camera: Camera,
  mic: Mic,
  palette: Palette,
  "pen-tool": PenTool,
};

interface CategoryPillProps {
  category: Category;
  className?: string;
}

export function CategoryPill({ category, className }: CategoryPillProps) {
  const Icon = iconMap[category.icon ?? ""] ?? Palette;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group flex flex-col justify-between rounded-2xl border border-white/8 bg-card p-8 transition-brand hover:border-accent/40 hover:bg-card/90 hover:shadow-md hover:shadow-black/20",
        className
      )}
    >
      <Icon className="size-8 text-accent transition-transform group-hover:scale-110" />
      <div className="mt-12">
        <h3 className="font-heading text-2xl font-semibold">{category.name}</h3>
        {category.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
