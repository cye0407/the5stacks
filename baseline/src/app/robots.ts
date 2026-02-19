import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/signup"],
        disallow: ["/dashboard", "/data", "/exports", "/respond", "/settings", "/onboarding", "/360-view"],
      },
    ],
    sitemap: "https://the5stacks.com/sitemap.xml",
  };
}
