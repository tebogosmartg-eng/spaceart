export const queryKeys = {
  session: ["session"] as const,
  profile: (userId?: string) => ["profile", userId] as const,
  creative: (profileId?: string) => ["creative", profileId] as const,
  categories: ["categories"] as const,
  listings: {
    all: ["listings"] as const,
    published: (filters?: Record<string, string | undefined>) =>
      ["listings", "published", filters] as const,
    owner: (profileId?: string) => ["listings", "owner", profileId] as const,
    detail: (slug?: string) => ["listings", "detail", slug] as const,
  },
  creatives: {
    approved: (filters?: Record<string, string | undefined>) =>
      ["creatives", "approved", filters] as const,
    featured: ["creatives", "featured"] as const,
  },
};
