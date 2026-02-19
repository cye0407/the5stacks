import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/baseline",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
