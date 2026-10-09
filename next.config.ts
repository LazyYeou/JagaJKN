import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  typescript: {
    tsconfigPath: process.env.NEXT_BUILD_DIR ? "tsconfig.e2e.json" : "tsconfig.json",
  },
};

export default nextConfig;
