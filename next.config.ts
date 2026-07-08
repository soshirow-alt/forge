import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
  },
  /**
   * Public crawler URL ends with `.png` (X sniffing + Content-Type honesty).
   * App Router folders named `*.png` are unreliable on Vercel (404), so rewrite
   * to the extensionless route handler that serves ImageResponse PNG bytes.
   */
  async rewrites() {
    return [
      {
        source: "/api/projects/:projectId/og-image.png",
        destination: "/api/projects/:projectId/og-image",
      },
    ];
  },
};

export default nextConfig;
