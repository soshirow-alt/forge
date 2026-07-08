import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
  },
  /**
   * Public crawler URL ends with `.png` (X sniffing + Content-Type honesty).
   * App Router folders named `*.png` 404 on Vercel; beforeFiles rewrite avoids
   * static-extension handling that skips afterFiles rewrites.
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/projects/:projectId/og-image.png",
          destination: "/api/projects/:projectId/og-image",
        },
      ],
    };
  },
};

export default nextConfig;
