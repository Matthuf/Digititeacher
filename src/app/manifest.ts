import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SendaLore – Geschichten, die deinen Weg begleiten",
    short_name: "SendaLore",
    description:
      "GPS-geführte Audiotouren zum Wandern – handgemacht, direkt im Browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#101d22",
    theme_color: "#a9622a",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
