"use client";

import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { UserRole } from "@/shared/types/database";
import { cn } from "@/lib/utils";

interface AdminRoleBadgeProps {
  role: UserRole | string;
  showAdminMode?: boolean;
  className?: string;
}

export function AdminRoleBadge({
  role,
  showAdminMode = false,
  className,
}: AdminRoleBadgeProps) {
  const label =
    role === "admin" ? "Admin" : role === "moderator" ? "Moderator" : null;
  if (!label) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAdminMode && role === "admin" && (
        <Badge variant="accent" className="gap-1 font-medium">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          Admin Mode
        </Badge>
      )}
      <Badge variant="outline" className="gap-1 border-accent/30 text-accent">
        <Shield className="size-3" />
        {label}
      </Badge>
    </div>
  );
}
