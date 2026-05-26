function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;

  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[spaceart] NEXT_PUBLIC_SITE_URL not set in production — falling back to localhost. " +
        "Set this environment variable in Vercel to prevent auth redirect issues."
    );
  }

  return "http://localhost:3000";
}

export const siteConfig = {
  name: "SPACEART",
  tagline: "Where Creativity Becomes Opportunity",
  taglineLong: "A premium platform for township and rural creatives",
  description:
    "SPACEART is the digital home for township and rural creators — showcase your work, connect with buyers, and build sustainable creative income year-round.",
  url: resolveSiteUrl(),
  locale: "en-ZA",
  ogImage: "/og-default.png",
} as const;

export function buildPageMetadata({
  title,
  description,
  path = "",
}: {
  title: string;
  description?: string;
  path?: string;
}) {
  const url = `${siteConfig.url}${path}`;
  return {
    title,
    description: description ?? siteConfig.description,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description: description ?? siteConfig.description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | ${siteConfig.name}`,
      description: description ?? siteConfig.description,
    },
  };
}
