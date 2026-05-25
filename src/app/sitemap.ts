import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/config/site";
import { getCategories } from "@/domains/categories/queries/get-categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const categories = await getCategories();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/creatives`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/listings`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/auth/sign-up`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const categoryRoutes = categories.map((cat) => ({
    url: `${base}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
