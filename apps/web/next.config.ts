import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Increase for file uploads
    },
    proxyClientMaxBodySize: "50mb",
  },
  images: {
    loaderFile: "./lib/supabase/supabase-image-loader.ts",
    remotePatterns: [
      {
        hostname: "gizvqzsieazwdfncjxrg.supabase.co",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
