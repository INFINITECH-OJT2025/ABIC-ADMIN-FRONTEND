import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 75],
  },
  allowedDevOrigins: ["192.168.254.158", "192.168.254.150", "192.168.254.124" , "192.168.254.141", "192.168.254.108"],
};

export default nextConfig;
