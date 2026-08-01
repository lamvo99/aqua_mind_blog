import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.life"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AquaMind — Aquarium & Aquascaping Blog",
    short_name: "AquaMind",
    description: "Free aquarium guides, tools and a verified database of fish, plants and corals.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0e7490",
    categories: ["education", "utilities", "hobbies"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Compatibility Checker", url: "/tools/compatibility-checker", description: "Check fish compatibility and stocking" },
      { name: "Setup Planner", url: "/setup-planner", description: "Personalized first-tank plan" },
      { name: "Finder Quiz", url: "/finder", description: "Find fish, plants and corals for your tank" },
    ],
  }
}
