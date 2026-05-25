"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { dashboardNav, staffAdminNav } from "@/shared/config/navigation";
import { Shield } from "lucide-react";

interface DashboardStudioNavProps {
  isStaff: boolean;
}

export function DashboardStudioNav({ isStaff }: DashboardStudioNavProps) {
  const pathname = usePathname();

  function linkClass(href: string) {
    const active =
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "rounded-xl px-3 py-2.5 text-sm transition-brand",
      active
        ? "bg-white/5 font-medium text-foreground"
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    );
  }

  return (
    <nav className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow mb-4 text-muted-foreground">Studio</p>
        <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-0.5">
          {dashboardNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {isStaff && (
        <div>
          <p className="text-eyebrow mb-4 flex items-center gap-2 text-accent">
            <Shield className="size-3.5" />
            Admin
          </p>
          <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-0.5">
            {staffAdminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  linkClass(item.href),
                  "border-l-2 border-transparent lg:border-l-accent/50 lg:pl-2.5",
                  (item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)) &&
                    "border-accent text-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
