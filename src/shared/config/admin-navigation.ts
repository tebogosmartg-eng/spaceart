import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  Shield,
  Star,
  Users,
  Package,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  shortcut?: string;
  badgeKey?: "pendingCreatives" | "pendingListings";
  staffOnly?: boolean;
};

export const adminNav: AdminNavItem[] = [
  {
    label: "Admin Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Moderation overview and platform health",
    shortcut: "G O",
  },
  {
    label: "Creators Moderation",
    href: "/admin/creators",
    icon: Users,
    description: "Review and approve creator profiles",
    shortcut: "G C",
    badgeKey: "pendingCreatives",
  },
  {
    label: "Listings Moderation",
    href: "/admin/listings",
    icon: Package,
    description: "Review listings before they go live",
    shortcut: "G L",
    badgeKey: "pendingListings",
  },
  {
    label: "Reviews Queue",
    href: "/admin/reviews",
    icon: Star,
    description: "Pending creator reviews",
    shortcut: "G R",
    badgeKey: "pendingCreatives",
  },
  {
    label: "Platform Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Growth, inventory, and moderation metrics",
    shortcut: "G A",
  },
];

export const adminQuickActions = [
  {
    label: "Review pending creators",
    href: "/admin/creators?status=pending",
    icon: Users,
  },
  {
    label: "Review pending listings",
    href: "/admin/listings?status=pending_review",
    icon: Package,
  },
  {
    label: "Open command palette",
    href: "#command",
    icon: Shield,
  },
] as const;

export type AdminViewMode = "marketplace" | "creator" | "admin";

export const adminViewModes: {
  id: AdminViewMode;
  label: string;
  href: string;
  description: string;
}[] = [
  {
    id: "marketplace",
    label: "Marketplace",
    href: "/",
    description: "Public browse experience",
  },
  {
    id: "creator",
    label: "Creator Studio",
    href: "/dashboard",
    description: "Your creator workspace",
  },
  {
    id: "admin",
    label: "Admin Console",
    href: "/admin",
    description: "Platform operations",
  },
];

export function isAdminNavActive(href: string, currentPath: string): boolean {
  if (href === "/admin") return currentPath === "/admin";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
