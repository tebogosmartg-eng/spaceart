import type { MetadataRoute } from "next";
import { buildCanonicalPath } from "@/shared/config/canonical-url";
import { getCategories } from "@/domains/categories/queries/get-categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: buildCanonicalPath("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: buildCanonicalPath("/creatives"), changeFrequency: "daily", priority: 0.9 },
    { url: buildCanonicalPath("/listings"), changeFrequency: "daily", priority: 0.9 },
    { url: buildCanonicalPath("/categories"), changeFrequency: "weekly", priority: 0.8 },
    { url: buildCanonicalPath("/search"), changeFrequency: "weekly", priority: 0.7 },
    { url: buildCanonicalPath("/auth/sign-up"), changeFrequency: "monthly", priority: 0.6 },
  ];

  const categoryRoutes = categories.map((cat) => ({
    url: buildCanonicalPath(`/categories/${cat.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
