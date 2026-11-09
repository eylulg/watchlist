import { useEffect, useState } from "react";
import { Moon01, Sun } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useTheme } from "@/providers/theme-provider";

const prefersDark = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [systemDark, setSystemDark] = useState(prefersDark);

    useEffect(() => {
        if (typeof window.matchMedia !== "function") return;
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            setSystemDark(query.matches);
        };
        query.addEventListener("change", onChange);
        return () => {
            query.removeEventListener("change", onChange);
        };
    }, []);

    const isDark = theme === "dark" || (theme === "system" && systemDark);

    return (
        <ButtonUtility
            aria-label="Dark mode"
            aria-pressed={isDark}
            color="tertiary"
            size="sm"
            icon={isDark ? Moon01 : Sun}
            onPress={() => {
                setTheme(isDark ? "light" : "dark");
            }}
        />
    );
};
