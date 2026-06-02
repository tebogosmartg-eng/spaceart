import type { MetadataRoute } from "next";
import { buildCanonicalPath } from "@/shared/config/canonical-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/admin/"] },
    sitemap: buildCanonicalPath("/sitemap.xml"),
  };
}
