"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "./sign-out-button";
import { Shield } from "lucide-react";
import { adminNav } from "@/shared/config/admin-navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/shared/types/database";

interface UserMenuProps {
  isStaff?: boolean;
  isAdmin?: boolean;
  role?: UserRole | null;
}

export function UserMenu({ isStaff, isAdmin, role }: UserMenuProps) {
  const initials = role === "admin" ? "AD" : role === "moderator" ? "MO" : "ME";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="sm"
          aria-label="Account menu"
          className={cn(
            "gap-2 pr-2",
            isAdmin && "ring-2 ring-accent/40 ring-offset-2 ring-offset-background"
          )}
        >
          <Avatar
            size="sm"
            className={cn(isAdmin && "ring-1 ring-accent/50")}
          >
            <AvatarFallback className="text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">Account</span>
          {isAdmin && (
            <span className="hidden rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent md:inline">
              Admin
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <Link href="/dashboard" className="w-full">
            Creator Studio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/dashboard/profile" className="w-full">
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/dashboard/listings" className="w-full">
            My Listings
          </Link>
        </DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Platform operations
            </p>
            {adminNav.slice(0, 4).map((item) => (
              <DropdownMenuItem key={item.href}>
                <Link href={item.href} className="flex w-full items-center gap-2">
                  <Shield className="size-3.5 text-accent" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem>
              <Link href="/admin" className="w-full font-medium text-accent">
                Admin Console →
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <SignOutButton variant="ghost" className="w-full justify-start" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
