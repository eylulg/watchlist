import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "Watchlist",
        short_name: "Watchlist",
        description: "Your personal movie and series watchlist, powered by TMDB.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0f0d0b",
        theme_color: "#0f0d0b",
        categories: ["entertainment", "lifestyle"],
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}
