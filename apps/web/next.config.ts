import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  transpilePackages: ["@repo/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Increase for file uploads
    },
    proxyClientMaxBodySize: "50mb",
  },
  reactCompiler: true,
  images: {
    loaderFile: "./lib/supabase/supabase-image-loader.ts",
    remotePatterns: [
      {
        hostname: "gizvqzsieazwdfncjxrg.supabase.co",
        protocol: "https",
      },
    ],
  }, async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
