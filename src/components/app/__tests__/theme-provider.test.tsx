import { describe, expect, it } from "vitest";
import { themeScript } from "../theme-provider";

describe("theme script", () => {
    it.each([
        ["a stored dark theme", "dark", true],
        ["a stored light theme", "light", false],
        ["no stored theme on a light system", null, false],
    ])("applies %s before React loads", (_, stored, isDark) => {
        if (stored) window.localStorage.setItem("watchlist:theme", stored);

        window.eval(themeScript);

        expect(document.documentElement.classList.contains("dark-mode")).toBe(isDark);
    });
});
