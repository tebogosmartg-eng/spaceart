"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/shared/brand";
import { mainNav } from "@/shared/config/navigation";
import { adminNav } from "@/shared/config/admin-navigation";
import { SearchInput } from "./search-input";
import { LinkButton } from "./link-button";
import { SignOutButton } from "./sign-out-button";
import { Badge } from "@/components/ui/badge";

interface MobileNavProps {
  isAuthenticated: boolean;
  isStaff?: boolean;
  isAdmin?: boolean;
}

export function MobileNav({
  isAuthenticated,
  isStaff,
  isAdmin,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      <div
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={close}
        aria-hidden
      />
      <nav
        className={`fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/8 bg-background/95 p-6 shadow-xl backdrop-blur-2xl transition-[transform,opacity] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
        aria-label="Mobile"
        aria-hidden={!open}
      >
        <Logo href="/" variant="full" compact markSize={30} wordmarkSize="sm" className="mb-6" />
        {isAdmin && (
          <Badge variant="accent" className="mb-4 gap-1">
            Admin Mode
          </Badge>
        )}
        <SearchInput className="mb-6" />
        <ul className="space-y-4">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-lg font-medium"
                onClick={close}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {isStaff && (
          <>
            <p className="text-eyebrow mt-8 mb-3 flex items-center gap-2 text-accent">
              <Shield className="size-3.5" />
              Admin
            </p>
            <ul className="space-y-3">
              {adminNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-base font-medium text-accent"
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-8 flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <LinkButton href="/dashboard" variant="outline" onClick={close}>
                Creator Studio
              </LinkButton>
              {isStaff && (
                <LinkButton href="/admin" variant="accent" onClick={close}>
                  Admin Console
                </LinkButton>
              )}
              <SignOutButton variant="outline" className="w-full" />
            </>
          ) : (
            <>
              <LinkButton href="/auth/sign-in" variant="outline">
                Sign in
              </LinkButton>
              <LinkButton href="/auth/sign-up" variant="accent">
                Join SpaceArt
              </LinkButton>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
