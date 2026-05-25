import type {
  Category,
  Creative,
  ListingWithRelations,
} from "@/shared/types/database";

/** Curated demo content when Supabase has no approved records yet */
export const DEMO_CREATIVES: Creative[] = [
  {
    id: "demo-1",
    profile_id: "demo-profile-1",
    slug: "naledi-mokoena",
    display_name: "Naledi Mokoena",
    bio: "Contemporary fashion designer blending Shweshwe heritage with luxury minimalism.",
    city: "Cape Town",
    province: "Western Cape",
    whatsapp_number: "+27821234567",
    cover_image_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    status: "approved",
    verified: true,
    is_featured: true,
    rejection_note: null,
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    profile_id: "demo-profile-2",
    slug: "thabo-khumalo",
    display_name: "Thabo Khumalo",
    bio: "Portrait and documentary photographer capturing urban African narratives.",
    city: "Johannesburg",
    province: "Gauteng",
    whatsapp_number: "+27831234567",
    cover_image_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    status: "approved",
    verified: false,
    is_featured: true,
    rejection_note: null,
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    profile_id: "demo-profile-3",
    slug: "zanele-dlamini",
    display_name: "Zanele Dlamini",
    bio: "Amapiano producer and live performer shaping the sound of new Africa.",
    city: "Durban",
    province: "KwaZulu-Natal",
    whatsapp_number: "+27841234567",
    cover_image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    status: "approved",
    verified: true,
    is_featured: true,
    rejection_note: null,
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const demoCategories: Record<string, Category> = {
  fashion: {
    id: "cat-fashion",
    slug: "fashion",
    name: "Fashion",
    description: "Contemporary African fashion",
    icon: "shirt",
    sort_order: 2,
    created_at: "",
  },
  photography: {
    id: "cat-photo",
    slug: "photography",
    name: "Photography",
    description: "Visual storytelling",
    icon: "camera",
    sort_order: 3,
    created_at: "",
  },
  music: {
    id: "cat-music",
    slug: "music",
    name: "Music",
    description: "African sounds",
    icon: "music",
    sort_order: 1,
    created_at: "",
  },
};

export const DEMO_LISTINGS: ListingWithRelations[] = [
  {
    id: "demo-listing-1",
    creative_id: "demo-1",
    category_id: "cat-fashion",
    slug: "bespoke-shweshwe-couture",
    title: "Bespoke Shweshwe Couture",
    description:
      "Custom evening wear and bridal pieces crafted with premium local textiles.",
    status: "published",
    is_trending: true,
    price_from_cents: 850000,
    price_label: "From R8,500",
    rejection_note: null,
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creatives: DEMO_CREATIVES[0],
    categories: demoCategories.fashion,
    listing_media: [
      {
        id: "dm-1",
        listing_id: "demo-listing-1",
        cloudinary_public_id: "demo-1",
        storage_path: null,
        url: "https://images.unsplash.com/photo-1558171813-4c088753bda1?w=800&q=80",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
  {
    id: "demo-listing-2",
    creative_id: "demo-2",
    category_id: "cat-photo",
    slug: "editorial-portrait-sessions",
    title: "Editorial Portrait Sessions",
    description:
      "Studio and on-location portrait packages for brands, artists, and editorial.",
    status: "published",
    is_trending: true,
    price_from_cents: 350000,
    price_label: "From R3,500",
    rejection_note: null,
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creatives: DEMO_CREATIVES[1],
    categories: demoCategories.photography,
    listing_media: [
      {
        id: "dm-2",
        listing_id: "demo-listing-2",
        cloudinary_public_id: "demo-2",
        storage_path: null,
        url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
  {
    id: "demo-listing-3",
    creative_id: "demo-3",
    category_id: "cat-music",
    slug: "live-amapiano-performance",
    title: "Live Amapiano Performance",
    description:
      "High-energy live sets for festivals, brand activations, and private events.",
    status: "published",
    is_trending: true,
    price_from_cents: 1200000,
    price_label: "From R12,000",
    rejection_note: null,
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creatives: DEMO_CREATIVES[2],
    categories: demoCategories.music,
    listing_media: [
      {
        id: "dm-3",
        listing_id: "demo-listing-3",
        cloudinary_public_id: "demo-3",
        storage_path: null,
        url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
  {
    id: "demo-listing-4",
    creative_id: "demo-1",
    category_id: "cat-fashion",
    slug: "personal-styling-consultation",
    title: "Personal Styling Consultation",
    description: "Wardrobe curation and look development for creatives and professionals.",
    status: "published",
    is_trending: false,
    price_from_cents: 150000,
    price_label: "R1,500 / session",
    rejection_note: null,
    published_at: new Date().toISOString(),
    approved_at: new Date().toISOString(),
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creatives: DEMO_CREATIVES[0],
    categories: demoCategories.fashion,
    listing_media: [
      {
        id: "dm-4",
        listing_id: "demo-listing-4",
        cloudinary_public_id: "demo-4",
        storage_path: null,
        url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
        sort_order: 0,
        created_at: "",
      },
    ],
  },
];

export function getDemoFeaturedCreatives(): Creative[] {
  return DEMO_CREATIVES.filter((c) => c.is_featured);
}

export function getDemoTrendingListings(): ListingWithRelations[] {
  return DEMO_LISTINGS.filter((l) => l.is_trending);
}

export function getDemoApprovedCreatives(limit?: number): Creative[] {
  return limit ? DEMO_CREATIVES.slice(0, limit) : DEMO_CREATIVES;
}

export function getDemoPublishedListings(options?: {
  categorySlug?: string;
  limit?: number;
}): ListingWithRelations[] {
  let items = DEMO_LISTINGS;
  if (options?.categorySlug) {
    items = items.filter((l) => l.categories?.slug === options.categorySlug);
  }
  if (options?.limit) items = items.slice(0, options.limit);
  return items;
}

export function getDemoCreativeBySlug(slug: string): Creative | null {
  return DEMO_CREATIVES.find((c) => c.slug === slug) ?? null;
}

export function getDemoListingBySlug(slug: string): ListingWithRelations | null {
  return DEMO_LISTINGS.find((l) => l.slug === slug) ?? null;
}

export function getDemoListingsByCreativeId(
  creativeId: string
): ListingWithRelations[] {
  return DEMO_LISTINGS.filter((l) => l.creative_id === creativeId);
}
