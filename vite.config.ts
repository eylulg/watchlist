/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { type Plugin, defineConfig } from "vite";

/**
 * GitHub Pages has no SPA rewrites. Serving a copy of index.html as 404.html
 * lets deep links such as /movies-series-website-demo/movie/27205 boot the app,
 * after which React Router renders the right route.
 */
const spaFallback = (): Plugin => {
    let outDir = "dist";
    return {
        name: "spa-404-fallback",
        apply: "build",
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
            await copyFile(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
        },
    };
};

export default defineConfig({
    base: "/movies-series-website-demo/",
    plugins: [react(), tailwindcss(), spaFallback()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                // Long lived vendor chunks so app deploys do not bust the cache for libraries.
                manualChunks(id) {
                    if (!id.includes("node_modules")) return undefined;
                    if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
                    if (id.includes("node_modules/react-router")) return "router";
                    if (
                        /node_modules\/(@react-aria|react-aria|react-aria-components|@react-stately|react-stately|@internationalized|@swc)\//.test(
                            id,
                        )
                    )
                        return "react-aria";
                    return "vendor";
                },
            },
        },
    },
    test: {
        environment: "jsdom",
        globals: false,
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        restoreMocks: true,
        env: {
            VITE_TMDB_API_KEY: "test-key",
        },
    },
});
