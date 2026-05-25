"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";

interface SearchInputProps {
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  /** Reduced visual weight for navbar embedding */
  compact?: boolean;
}

export function SearchInput({
  defaultValue = "",
  className,
  placeholder = "Search creatives and listings...",
  compact = false,
}: SearchInputProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2",
          compact
            ? "size-3.5 text-muted-foreground/50"
            : "size-4 text-muted-foreground"
        )}
      />
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder={compact ? "Search..." : placeholder}
        className={cn(
          "pl-10",
          compact
            ? "h-9 border-white/[0.06] bg-transparent text-sm placeholder:text-muted-foreground/40"
            : "bg-card"
        )}
        aria-label="Search"
      />
    </form>
  );
}
