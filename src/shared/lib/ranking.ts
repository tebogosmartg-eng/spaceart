/**
 * Marketplace ranking — signal-based content authenticity scoring.
 *
 * Prioritizes real marketplace participants over seeded/placeholder content
 * using heuristic signals. Designed for extensibility: future engagement
 * signals (likes, saves, inquiries, purchases) plug directly into the
 * scoring functions without refactoring consumers.
 */

import type { Creative, ListingWithRelations } from "@/shared/types/database";

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

const DEMO_ID_PREFIX = "demo-";
const STOCK_IMAGE_HOSTS = ["unsplash.com", "images.unsplash.com", "pexels.com"];

/** Returns true if the id belongs to in-memory demo/placeholder content. */
export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}

/** Returns true if a URL points to a known stock image service. */
function isStockImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return STOCK_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/** Returns true if the image URL appears to be a real user upload. */
function isAuthenticImageUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith("http")) return false;
  return !isStockImageUrl(url);
}

// ---------------------------------------------------------------------------
// Creative Scoring
// ---------------------------------------------------------------------------

export interface CreativeRankSignals {
  isRealId: boolean;
  hasAuthenticAvatar: boolean;
  hasAuthenticCover: boolean;
  hasBio: boolean;
  hasWhatsApp: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  /** Future: listing count owned by this creative */
  listingCount?: number;
  /** Future: total engagement (views, inquiries, saves) */
  engagementScore?: number;
}

/**
 * Extract ranking signals from a creative profile.
 * Pure function — safe for SSR, no side effects.
 */
export function extractCreativeSignals(creative: Creative): CreativeRankSignals {
  return {
    isRealId: !isDemoId(creative.id),
    hasAuthenticAvatar: isAuthenticImageUrl(creative.avatar_url),
    hasAuthenticCover: isAuthenticImageUrl(creative.cover_image_url),
    hasBio: Boolean(creative.bio && creative.bio.trim().length > 10),
    hasWhatsApp: Boolean(creative.whatsapp_number),
    isVerified: creative.verified,
    isFeatured: creative.is_featured,
  };
}

/**
 * Compute an authenticity score for ranking.
 * Higher score = more likely a real, active marketplace participant.
 */
export function scoreCreative(creative: Creative): number {
  const signals = extractCreativeSignals(creative);
  let score = 0;

  // Hard signal: not demo/placeholder content
  if (signals.isRealId) score += 100;

  // Strong signals: real uploaded content
  if (signals.hasAuthenticAvatar) score += 40;
  if (signals.hasAuthenticCover) score += 30;

  // Engagement signals
  if (signals.hasBio) score += 15;
  if (signals.hasWhatsApp) score += 20;
  if (signals.isVerified) score += 25;
  if (signals.isFeatured) score += 10;

  // Future extensibility (when data becomes available)
  if (signals.listingCount) score += Math.min(signals.listingCount * 5, 30);
  if (signals.engagementScore) score += Math.min(signals.engagementScore, 50);

  return score;
}

// ---------------------------------------------------------------------------
// Listing Scoring
// ---------------------------------------------------------------------------

export interface ListingRankSignals {
  isRealId: boolean;
  hasAuthenticMedia: boolean;
  mediaCount: number;
  hasDescription: boolean;
  hasCreator: boolean;
  creatorIsReal: boolean;
  isTrending: boolean;
  /** Future: view count */
  viewCount?: number;
  /** Future: inquiry count */
  inquiryCount?: number;
}

/**
 * Extract ranking signals from a listing.
 * Pure function — safe for SSR, no side effects.
 */
export function extractListingSignals(
  listing: ListingWithRelations
): ListingRankSignals {
  const media = listing.listing_media ?? [];
  const hasAuthenticMedia = media.some((m) => isAuthenticImageUrl(m.url));

  return {
    isRealId: !isDemoId(listing.id),
    hasAuthenticMedia,
    mediaCount: media.length,
    hasDescription: Boolean(
      listing.description && listing.description.trim().length > 20
    ),
    hasCreator: Boolean(listing.creatives),
    creatorIsReal: listing.creatives ? !isDemoId(listing.creatives.id) : false,
    isTrending: listing.is_trending,
  };
}

/**
 * Compute an authenticity score for listing ranking.
 * Higher score = more likely real marketplace activity.
 */
export function scoreListing(listing: ListingWithRelations): number {
  const signals = extractListingSignals(listing);
  let score = 0;

  // Hard signal: not demo content
  if (signals.isRealId) score += 100;
  if (signals.creatorIsReal) score += 50;

  // Content quality signals
  if (signals.hasAuthenticMedia) score += 40;
  score += Math.min(signals.mediaCount * 10, 30);
  if (signals.hasDescription) score += 15;
  if (signals.isTrending) score += 10;

  // Future extensibility
  if (signals.viewCount) score += Math.min(signals.viewCount, 30);
  if (signals.inquiryCount) score += Math.min(signals.inquiryCount * 5, 50);

  return score;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Rank creatives by marketplace authenticity score (descending).
 * Stable sort — preserves DB order for equal scores.
 */
export function rankCreatives(creatives: Creative[]): Creative[] {
  return [...creatives].sort((a, b) => scoreCreative(b) - scoreCreative(a));
}

/**
 * Rank listings by marketplace authenticity score (descending).
 * Stable sort — preserves DB order for equal scores.
 */
export function rankListings(
  listings: ListingWithRelations[]
): ListingWithRelations[] {
  return [...listings].sort((a, b) => scoreListing(b) - scoreListing(a));
}

// ---------------------------------------------------------------------------
// Backfill
// ---------------------------------------------------------------------------

/**
 * Merge real content with placeholder backfill, ensuring:
 * 1. Real content always leads
 * 2. Placeholders fill remaining slots for visual density
 * 3. Never exceed the target count
 */
export function backfillCreatives(
  real: Creative[],
  fallback: Creative[],
  targetCount: number
): Creative[] {
  const ranked = rankCreatives(real);
  if (ranked.length >= targetCount) return ranked.slice(0, targetCount);
  const existingIds = new Set(ranked.map((c) => c.id));
  const fillers = fallback.filter((c) => !existingIds.has(c.id));
  return [...ranked, ...fillers].slice(0, targetCount);
}

/**
 * Merge real listings with placeholder backfill.
 */
export function backfillListings(
  real: ListingWithRelations[],
  fallback: ListingWithRelations[],
  targetCount: number
): ListingWithRelations[] {
  const ranked = rankListings(real);
  if (ranked.length >= targetCount) return ranked.slice(0, targetCount);
  const existingIds = new Set(ranked.map((l) => l.id));
  const fillers = fallback.filter((l) => !existingIds.has(l.id));
  return [...ranked, ...fillers].slice(0, targetCount);
}
