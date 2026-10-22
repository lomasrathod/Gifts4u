import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["@libsql/client"],
  async headers() {
    return [
      {
        // Gift pages are private: never index them.
        source: "/g/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default config;
