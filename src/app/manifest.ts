import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Served at /manifest.webmanifest. Makes the site installable from the browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.titleName} · USDG liquidity`,
    short_name: BRAND.titleName,
    description: BRAND.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F3EFE6",
    theme_color: "#1B4332",
    categories: ["finance"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Markets", url: "/markets" },
      { name: "Portfolio", url: "/portfolio" },
      { name: "Verification", url: "/verify" },
    ],
  };
}
