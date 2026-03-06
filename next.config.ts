import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
  },
  allowedDevOrigins: ["192.168.254.158", "192.168.254.150"],
};

export default nextConfig;
