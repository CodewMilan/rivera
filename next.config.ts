import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/*": ["./src/lib/database/schema.sql"],
  },
};

export default nextConfig;
