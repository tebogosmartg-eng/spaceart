"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/shared/lib/utils";

type Chip = { key: string; label: string };

export function FilterChips({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chips: Chip[] = [];
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const province = searchParams.get("province");
  const sort = searchParams.get("sort");

  if (q) chips.push({ key: "q", label: `"${q}"` });
  if (category) chips.push({ key: "category", label: category });
  if (province) chips.push({ key: "province", label: province });
  if (sort && sort !== "newest") chips.push({ key: "sort", label: sort });

  if (chips.length === 0) return null;

  function remove(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const base = window.location.pathname;
    router.push(params.toString() ? `${base}?${params}` : base);
  }

  function clearAll() {
    router.push(window.location.pathname);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => remove(chip.key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent/30 hover:bg-muted"
        >
          {chip.label}
          <X className="size-3 opacity-60" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
