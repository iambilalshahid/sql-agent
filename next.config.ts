import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/api/auth/login": ["./src/db/Ecommerce.db"],
  },
};

export default nextConfig;
