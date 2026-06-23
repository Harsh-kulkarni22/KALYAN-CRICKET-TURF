import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Limit workers to avoid memory exhaustion (OOM Zone Allocation errors) on resource-constrained systems
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
