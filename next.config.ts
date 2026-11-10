import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** The design system is linked from a sibling folder, so Turbopack's root must include it. */
const workspaceRoot = path.resolve(import.meta.dirname, "..");

/** The linked library has its own node_modules. Next already bundles its own React, but React Aria Components keeps router context in module state, so it needs one copy. */
const sharedPackages = ["react-aria-components"];

const nextConfig: NextConfig = {
    turbopack: {
        root: workspaceRoot,
        resolveAlias: Object.fromEntries(sharedPackages.map((name) => [name, `./node_modules/${name}`])),
    },
    reactStrictMode: true,
    poweredByHeader: false,
    // The TMDB key is read with process.env on the server only. Nothing in `env` here, on purpose:
    // values listed in `env` or prefixed with NEXT_PUBLIC_ are inlined into the client bundle.
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
            // Video thumbnails on detail pages.
            { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
        ],
        // TMDB images never change for a given path, so cache optimised copies for 30 days.
        minimumCacheTTL: 2_592_000,
        // TMDB sources are at most 1280px wide, so larger candidates only bloat every srcset.
        deviceSizes: [384, 640, 828, 1080, 1280],
        imageSizes: [48, 96, 160, 256],
    },
    experimental: {
        optimizePackageImports: ["lucide-react"],
        // The root layout is `[locale]/layout.tsx`, so unmatched URLs need their own 404 document.
        globalNotFound: true,
    },
    headers() {
        return Promise.resolve([
            { source: "/:path*", headers: securityHeaders },
            {
                source: "/sw.js",
                headers: [
                    { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                    { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                ],
            },
        ]);
    },
};

export default withNextIntl(nextConfig);
