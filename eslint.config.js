import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Components copied from Untitled UI React (MIT). Kept close to upstream so they can be updated. */
const vendorUi = [
    "src/components/base/**",
    "src/components/application/**",
    "src/components/foundations/**",
    "src/components/shared-assets/**",
    "src/hooks/use-clipboard.ts",
    "src/utils/cx.ts",
    "src/utils/is-react-component.ts",
];

export default defineConfig([
    globalIgnores([".next", "coverage", "playwright-report", "test-results", "next-env.d.ts", "public/sw.js"]),
    {
        files: ["**/*.{ts,tsx}"],
        ignores: vendorUi,
        extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
        plugins: { "@next/next": nextPlugin },
        languageOptions: {
            ecmaVersion: 2023,
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
            // The TMDB key must only be read on the server. Block the obvious ways to leak it to the browser.
            "no-restricted-syntax": [
                "error",
                {
                    selector: "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/^NEXT_PUBLIC_.*TMDB/]",
                    message: "Never expose TMDB credentials through NEXT_PUBLIC_ variables.",
                },
            ],
        },
    },
    {
        // Client components may not import the server only TMDB client.
        files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.ts", "src/lib/watchlist/**/*.ts"],
        ignores: [...vendorUi, "**/__tests__/**"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@/lib/tmdb/client", "@/lib/preferences"],
                            allowTypeImports: true,
                            message: "Server only module. Import types from @/lib/tmdb/types instead.",
                        },
                    ],
                },
            ],
        },
    },
    {
        // Vendored Untitled UI code: checked for real problems, but not held to the app's strict type aware style rules.
        files: vendorUi,
        extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
        languageOptions: { ecmaVersion: 2023, globals: globals.browser },
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/refs": "off",
        },
    },
    {
        files: ["**/__tests__/**", "src/test-utils/**", "e2e/**"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
    {
        files: ["*.config.{js,ts,mjs}", "scripts/**", "e2e/mock-tmdb/**"],
        languageOptions: { globals: globals.node },
    },
    {
        files: ["**/*.{js,mjs}"],
        extends: [js.configs.recommended],
        languageOptions: { globals: { ...globals.node } },
    },
    prettier,
]);
