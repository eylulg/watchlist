import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Components copied from Untitled UI React (MIT). Kept close to upstream so they can be updated. */
const vendorUi = [
    "src/components/base/**",
    "src/components/application/**",
    "src/components/foundations/**",
    "src/components/shared-assets/**",
    "src/hooks/use-breakpoint.ts",
    "src/hooks/use-resize-observer.ts",
    "src/utils/cx.ts",
    "src/utils/is-react-component.ts",
];

export default defineConfig([
    globalIgnores(["dist", "coverage"]),
    {
        files: ["**/*.{ts,tsx}"],
        ignores: vendorUi,
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            jsxA11y.flatConfigs.recommended,
        ],
        languageOptions: {
            ecmaVersion: 2023,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
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
        files: ["**/*.test.{ts,tsx}", "src/test/**"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
            "react-refresh/only-export-components": "off",
        },
    },
    {
        files: ["*.config.{js,ts}"],
        languageOptions: { globals: globals.node },
    },
    prettier,
]);
