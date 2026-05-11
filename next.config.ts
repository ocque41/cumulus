import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@cumulus/auth'],

  // Prevent animejs from being code-split to avoid 404 chunk errors in production
  // Using serverExternalPackages to ensure proper bundling in Turbopack
  serverExternalPackages: [],

  // Optimize package imports to prevent unnecessary splitting
  experimental: {
    optimizePackageImports: ['animejs'],
  },
};

export default nextConfig;
