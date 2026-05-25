import { adminNav } from "@/shared/config/admin-navigation";

export const mainNav = [
  { label: "Explore", href: "/creatives" },
  { label: "Listings", href: "/listings" },
  { label: "Categories", href: "/categories" },
  { label: "Search", href: "/search" },
] as const;

export const footerNav = [
  { label: "Explore Creatives", href: "/creatives" },
  { label: "Browse Listings", href: "/listings" },
  { label: "Categories", href: "/categories" },
  { label: "Join SpaceArt", href: "/auth/sign-up" },
] as const;

export const dashboardNav = [
  { label: "Overview", href: "/dashboard" },
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Listings", href: "/dashboard/listings" },
] as const;

/** Shown in dashboard sidebar when user has staff role (admin/moderator). */
export const staffAdminNav = adminNav.map((item) => ({
  label: item.label.replace(" Moderation", "").replace("Admin Dashboard", "Admin"),
  href: item.href,
}));
