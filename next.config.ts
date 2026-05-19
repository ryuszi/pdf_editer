import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath: "/pdf_editer",
        assetPrefix: "/pdf_editer/",
        trailingSlash: true,
        images: {
          unoptimized: true
        }
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  }
};

export default nextConfig;
