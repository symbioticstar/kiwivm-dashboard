import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker builds, default for Vercel
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
};

export default nextConfig;
