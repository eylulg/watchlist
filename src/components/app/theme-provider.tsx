"use client";

import { type ReactNode, createContext, useContext, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    /** The theme actually shown: the system preference when `theme` is "system". */
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = "watchlist:theme";
const DARK_MODE_CLASS = "dark-mode";

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * It mirrors `readStoredTheme` and the class logic below and must stay dependency free.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("${DARK_MODE_CLASS}",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`;

const listeners = new Set<() => void>();
/** Used when storage is blocked, so the choice still applies for this visit. */
let memoryTheme: Theme | null = null;

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readStoredTheme = (): Theme => {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        return stored === "light" || stored === "dark" ? stored : "system";
    } catch {
        return memoryTheme ?? "system";
    }
};

const systemPrefersDark = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;

/** A primitive snapshot, so React can compare it by value. */
const getSnapshot = () => `${readStoredTheme()}:${systemPrefersDark() ? "dark" : "light"}`;

const subscribe = (onChange: () => void) => {
    const query = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    listeners.add(onChange);
    window.addEventListener("storage", onChange);
    query?.addEventListener("change", onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
        query?.removeEventListener("change", onChange);
    };
};

const setTheme = (next: Theme) => {
    memoryTheme = next;
    try {
        if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
        else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
        // Storage blocked: memoryTheme keeps the choice for this visit.
    }
    for (const listener of listeners) listener();
};

const parseSnapshot = (snapshot: string | null): Pick<ThemeContextValue, "theme" | "resolvedTheme"> => {
    const [stored, system] = (snapshot ?? "system:light").split(":");
    const theme: Theme = stored === "light" || stored === "dark" ? stored : "system";
    return { theme, resolvedTheme: theme === "system" ? (system === "dark" ? "dark" : "light") : theme };
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Null on the server and during hydration. Until then the inline script owns the class.
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
    const { theme, resolvedTheme } = parseSnapshot(snapshot);

    useEffect(() => {
        if (snapshot === null) return;
        const root = document.documentElement;
        root.classList.toggle(DARK_MODE_CLASS, resolvedTheme === "dark");
        root.style.colorScheme = resolvedTheme;
    }, [snapshot, resolvedTheme]);

    return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};
