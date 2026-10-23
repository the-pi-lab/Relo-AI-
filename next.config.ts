import type { NextConfig } from "next";

/**
 * Headers that are safe to send statically, including from the CDN for assets
 * that never reach the proxy. The per-request Content-Security-Policy lives in
 * `src/proxy.ts` because it carries a nonce.
 */
const staticSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Do not advertise the framework version to the internet.
  poweredByHeader: false,
  // Type errors must fail the build: silently shipping a broken bundle is a
  // worse outcome than a red deploy.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: staticSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
