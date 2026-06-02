import { buildCanonicalPath, getCanonicalSiteUrl } from "@/shared/config/canonical-url";

export const siteConfig = {
  name: "SPACEART",
  tagline: "Where Creativity Becomes Opportunity",
  taglineLong: "A premium platform for township and rural creatives",
  description:
    "SPACEART is the digital home for township and rural creators — showcase your work, connect with buyers, and build sustainable creative income year-round.",
  url: getCanonicalSiteUrl(),
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
  const url = buildCanonicalPath(path);
  return {
    title,
    description: description ?? siteConfig.description,
    alternates: {
      canonical: url,
    },
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
