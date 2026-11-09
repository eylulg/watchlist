"use client";

import { Moon01, Sun } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useTheme } from "./theme-provider";

export const ThemeToggle = () => {
    const t = useTranslations("Nav");
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    function handleToggle() {
        setTheme(isDark ? "light" : "dark");
    }

    return (
        <ButtonUtility
            aria-label={t("darkMode")}
            aria-pressed={isDark}
            color="tertiary"
            size="sm"
            icon={isDark ? Moon01 : Sun}
            onPress={handleToggle}
        />
    );
};
