"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterChips } from "@/shared/ui/filter-chips";
import { SA_PROVINCES } from "@/shared/config/provinces";
import type { Category } from "@/shared/types/database";
import { cn } from "@/shared/lib/utils";

type DiscoveryFiltersProps = {
  categories?: Category[];
  basePath: string;
  showCategory?: boolean;
  showProvince?: boolean;
  showSort?: boolean;
  className?: string;
};

export function DiscoveryFilters({
  categories = [],
  basePath,
  showCategory = true,
  showProvince = true,
  showSort = true,
  className,
}: DiscoveryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(params.toString() ? `${basePath}?${params}` : basePath);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateParam("q", (formData.get("q") as string)?.trim() ?? "");
  }

  return (
    <div className={cn("space-y-4", className)}>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/8 bg-card/50 p-4 backdrop-blur-sm md:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1 space-y-2">
            <label htmlFor="discovery-q" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="discovery-q"
                name="q"
                defaultValue={searchParams.get("q") ?? ""}
                placeholder="Creatives, services, locations…"
                className="h-10 bg-background/80 pl-10"
              />
            </div>
          </div>

          {showCategory && categories.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </span>
              <Select
                value={searchParams.get("category") ?? "all"}
                onValueChange={(v) =>
                  updateParam("category", !v || v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="h-10 w-full bg-background/80 md:w-44">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showProvince && (
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Province
              </span>
              <Select
                value={searchParams.get("province") ?? "all"}
                onValueChange={(v) =>
                  updateParam("province", !v || v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="h-10 w-full bg-background/80 md:w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All provinces</SelectItem>
                  {SA_PROVINCES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showSort && (
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sort
              </span>
              <Select
                value={searchParams.get("sort") ?? "newest"}
                onValueChange={(v) => updateParam("sort", v ?? "newest")}
              >
                <SelectTrigger className="h-10 w-full bg-background/80 md:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            variant="accent"
            className="h-10 shrink-0"
          >
            Apply
          </Button>
        </div>
      </form>
      <FilterChips />
    </div>
  );
}
