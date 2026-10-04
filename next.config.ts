import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Next 16 blocks dev assets when the browser host is not the one it expects.
  // 127.0.0.1 is the same machine as localhost; allow it so client components hydrate.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
