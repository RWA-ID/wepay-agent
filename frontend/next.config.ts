import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for IPFS hosting via wepay.eth contenthash
  output: "export",
  images: {
    unoptimized: true,  // Required for static export
  },
  // Ensure trailing slashes for IPFS gateway compatibility
  trailingSlash: true,
};

export default nextConfig;
