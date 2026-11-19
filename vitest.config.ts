import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
            // `server-only` throws outside a React Server Components bundle. Unit tests run the server code directly.
            "server-only": path.resolve(import.meta.dirname, "./src/test-utils/server-only-stub.ts"),
        },
    },
    test: {
        environment: "jsdom",
        globals: false,
        include: ["src/**/__tests__/*.test.{ts,tsx}"],
        setupFiles: ["./src/test-utils/setup.ts"],
        css: false,
        restoreMocks: true,
        env: {
            TMDB_API_KEY: "test-key",
            TMDB_API_BASE_URL: "https://api.themoviedb.org/3",
        },
        server: {
            deps: {
                // next-intl ships ESM that imports `next/navigation` without an extension.
                inline: ["next-intl"],
            },
        },
    },
});
