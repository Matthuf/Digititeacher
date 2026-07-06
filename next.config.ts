import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover-Bilder kommen aus Supabase Storage oder beliebigen vom Admin
    // eingetragenen HTTPS-URLs.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
