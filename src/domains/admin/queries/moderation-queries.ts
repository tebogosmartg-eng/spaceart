import { createClient } from "@/infrastructure/database/server";
import { isSupabaseConfigured } from "@/infrastructure/database/env";
import { tryGetStaffContext } from "@/infrastructure/auth/permissions";
import { logAuthEvent } from "@/infrastructure/auth/profile-resolution";
import type {
  ApprovalStatus,
  Creative,
  ListingStatus,
  ListingWithRelations,
} from "@/shared/types/database";

const DEFAULT_PAGE_SIZE = 10;

export type ModerationPageParams = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type ModerationPageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function parsePageParams(params: ModerationPageParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(params.pageSize) || DEFAULT_PAGE_SIZE)
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

const CREATIVE_STATUSES: ApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
];

const LISTING_STATUSES: ListingStatus[] = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
];

const EMPTY_PAGE = {
  items: [],
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 0,
};

export async function getCreativesModerationPage(
  params: ModerationPageParams = {}
): Promise<ModerationPageResult<Creative>> {
  const staff = await tryGetStaffContext();
  if (!staff) return { ...EMPTY_PAGE, page: Number(params.page) || 1 };

  if (!isSupabaseConfigured()) {
    return { ...EMPTY_PAGE, page: Number(params.page) || 1 };
  }

  const { page, pageSize, from, to } = parsePageParams(params);
  const supabase = await createClient();

  let query = supabase
    .from("creatives")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const status = params.status;
  if (status && status !== "all" && CREATIVE_STATUSES.includes(status as ApprovalStatus)) {
    query = query.eq("status", status as ApprovalStatus);
  }

  if (params.q?.trim()) {
    const term = params.q.trim();
    query = query.or(
      `display_name.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%,slug.ilike.%${term}%`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    logAuthEvent("error", "Creatives moderation query failed", {
      userId: staff.userId,
      role: staff.profile.role,
      details: error.message,
    });
    return { ...EMPTY_PAGE, page, pageSize };
  }

  const total = count ?? 0;
  return {
    items: (data as Creative[]) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}

export async function getListingsModerationPage(
  params: ModerationPageParams = {}
): Promise<ModerationPageResult<ListingWithRelations>> {
  const staff = await tryGetStaffContext();
  if (!staff) return { ...EMPTY_PAGE, page: Number(params.page) || 1 };

  if (!isSupabaseConfigured()) {
    return { ...EMPTY_PAGE, page: Number(params.page) || 1 };
  }

  const { page, pageSize, from, to } = parsePageParams(params);
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(`*, categories(*), creatives(*)`, { count: "exact" })
    .order("created_at", { ascending: false });

  const status = params.status;
  if (status && status !== "all" && LISTING_STATUSES.includes(status as ListingStatus)) {
    query = query.eq("status", status as ListingStatus);
  }

  if (params.q?.trim()) {
    const term = params.q.trim();
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    logAuthEvent("error", "Listings moderation query failed", {
      userId: staff.userId,
      role: staff.profile.role,
      details: error.message,
    });
    return { ...EMPTY_PAGE, page, pageSize };
  }

  const total = count ?? 0;
  return {
    items: (data as ListingWithRelations[]) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 0,
  };
}

export async function getAdminOverviewCounts() {
  const staff = await tryGetStaffContext();
  if (!staff) {
    return { pendingCreatives: 0, pendingListings: 0 };
  }

  if (!isSupabaseConfigured()) {
    return { pendingCreatives: 0, pendingListings: 0 };
  }

  const supabase = await createClient();

  const [creatives, listings] = await Promise.all([
    supabase
      .from("creatives")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
  ]);

  if (creatives.error || listings.error) {
    logAuthEvent("error", "Admin overview counts failed", {
      userId: staff.userId,
      role: staff.profile.role,
      creativesError: creatives.error?.message,
      listingsError: listings.error?.message,
    });
  }

  return {
    pendingCreatives: creatives.count ?? 0,
    pendingListings: listings.count ?? 0,
  };
}

export type AdminActivityItem = {
  id: string;
  type: "creative" | "listing";
  title: string;
  status: string;
  href: string;
  timestamp: string;
};

export type AdminDashboardSnapshot = {
  counts: {
    pendingCreatives: number;
    pendingListings: number;
    totalCreatives: number;
    totalListings: number;
    publishedListings: number;
    totalProfiles: number;
  };
  recentActivity: AdminActivityItem[];
  health: {
    supabaseConfigured: boolean;
    moderationBacklog: number;
    status: "healthy" | "attention" | "critical";
    message: string;
  };
};

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const empty: AdminDashboardSnapshot = {
    counts: {
      pendingCreatives: 0,
      pendingListings: 0,
      totalCreatives: 0,
      totalListings: 0,
      publishedListings: 0,
      totalProfiles: 0,
    },
    recentActivity: [],
    health: {
      supabaseConfigured: isSupabaseConfigured(),
      moderationBacklog: 0,
      status: "healthy",
      message: "All systems operational",
    },
  };

  const staff = await tryGetStaffContext();
  if (!staff) return empty;

  if (!isSupabaseConfigured()) {
    return {
      ...empty,
      health: {
        supabaseConfigured: false,
        moderationBacklog: 0,
        status: "critical",
        message: "Supabase is not configured",
      },
    };
  }

  const supabase = await createClient();

  const [
    pendingCreatives,
    pendingListings,
    totalCreatives,
    totalListings,
    publishedListings,
    totalProfiles,
    recentCreatives,
    recentListings,
  ] = await Promise.all([
    supabase
      .from("creatives")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase.from("creatives").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("creatives")
      .select("id, display_name, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("listings")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const pendingC = pendingCreatives.count ?? 0;
  const pendingL = pendingListings.count ?? 0;
  const backlog = pendingC + pendingL;

  const activity: AdminActivityItem[] = [
    ...((recentCreatives.data ?? []) as {
      id: string;
      display_name: string;
      status: string;
      updated_at: string;
    }[]).map((c) => ({
      id: c.id,
      type: "creative" as const,
      title: c.display_name,
      status: c.status,
      href: `/admin/creators?status=${c.status}`,
      timestamp: c.updated_at,
    })),
    ...((recentListings.data ?? []) as {
      id: string;
      title: string;
      status: string;
      updated_at: string;
    }[]).map((l) => ({
      id: l.id,
      type: "listing" as const,
      title: l.title,
      status: l.status,
      href: `/admin/listings?status=${l.status}`,
      timestamp: l.updated_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8);

  let healthStatus: AdminDashboardSnapshot["health"]["status"] = "healthy";
  let healthMessage = "Queues are within normal range";

  if (backlog > 25) {
    healthStatus = "critical";
    healthMessage = `${backlog} items awaiting moderation — prioritize review`;
  } else if (backlog > 8) {
    healthStatus = "attention";
    healthMessage = `${backlog} items in moderation queues`;
  }

  return {
    counts: {
      pendingCreatives: pendingC,
      pendingListings: pendingL,
      totalCreatives: totalCreatives.count ?? 0,
      totalListings: totalListings.count ?? 0,
      publishedListings: publishedListings.count ?? 0,
      totalProfiles: totalProfiles.count ?? 0,
    },
    recentActivity: activity,
    health: {
      supabaseConfigured: true,
      moderationBacklog: backlog,
      status: healthStatus,
      message: healthMessage,
    },
  };
}
