import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photos are resized in the browser to ≤1600px JPEG (~300–800 KB),
      // but leave headroom for large label shots.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    // Product photos from Open Food Facts.
    remotePatterns: [{ protocol: "https", hostname: "images.openfoodfacts.org" }],
  },
};

export default nextConfig;
