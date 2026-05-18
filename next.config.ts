import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repoRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  allowedDevOrigins: ['127.0.0.1'],
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
