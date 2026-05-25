export const siteConfig = {
  name: "SPACEART",
  tagline: "Where Creativity Becomes Opportunity",
  taglineLong: "A premium platform for township and rural creatives",
  description:
    "SPACEART is the digital home for township and rural creators — showcase your work, connect with buyers, and build sustainable creative income year-round.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
