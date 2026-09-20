import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  outputFileTracingIncludes: {
    "/*": ["./src/lib/database/schema.sql"],
  },
};

export default nextConfig;
