import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      { source: "/", destination: "/dashboard-v2.html" },
      { source: "/tong-quan", destination: "/dashboard-v2.html" },
      { source: "/production", destination: "/dashboard-v2.html" },
      { source: "/bluescope", destination: "/dashboard-v2.html" },
      { source: "/bluescope-public", destination: "/dashboard-v2.html" },
      { source: "/admin", destination: "/dashboard-v2.html" },
    ];
  },
};

export default nextConfig;
