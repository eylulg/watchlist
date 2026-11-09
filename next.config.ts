import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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
        optimizePackageImports: ["@untitledui/icons"],
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
