"use client";

import { type ChangeEvent, useState } from "react";
import { Monitor01, Moon01, Sun } from "@untitledui/icons";
import { useLocale, useTranslations } from "next-intl";
import type { Selection } from "react-aria-components";
import { panelTitleClass } from "@/components/app/styles";
import { type Theme, useTheme } from "@/components/app/theme-provider";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { NativeSelect } from "@/components/base/select/select-native";
import { isLocale, localeNames, locales } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { WATCH_REGIONS, isRegionCode, regionName, writeRegionCookie } from "@/lib/regions";

const THEMES = [
    { id: "light", icon: Sun },
    { id: "dark", icon: Moon01 },
    { id: "system", icon: Monitor01 },
] as const satisfies readonly { id: Theme; icon: typeof Sun }[];

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme.id === value);

export const SettingsForm = ({ region: initialRegion }: { region: string }) => {
    const t = useTranslations("Settings");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [region, setRegion] = useState(initialRegion);
    const [saved, setSaved] = useState("");

    const regions = [...new Set<string>([...WATCH_REGIONS, initialRegion])]
        .map((code) => ({ value: code, label: regionName(code, locale) }))
        .sort((a, b) => a.label.localeCompare(b.label, locale));

    function handleRegionChange(event: ChangeEvent<HTMLSelectElement>) {
        const next = event.target.value;
        if (!isRegionCode(next)) return;
        setRegion(next);
        writeRegionCookie(next);
        setSaved(t("regionSaved", { region: regionName(next, locale) }));
        // Server components read the cookie; refresh so detail pages pick it up.
        router.refresh();
    }

    function handleLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
        const next = event.target.value;
        if (isLocale(next)) router.replace(pathname, { locale: next });
    }

    function handleThemeChange(keys: Selection) {
        const [next] = keys === "all" ? [] : [...keys];
        if (isTheme(next)) setTheme(next);
    }

    return (
        <div className="flex max-w-xl flex-col gap-8">
            <section aria-labelledby="region-heading" className="flex flex-col gap-3">
                <h2 id="region-heading" className={panelTitleClass}>
                    {t("regionHeading")}
                </h2>
                <NativeSelect
                    label={t("regionLabel")}
                    hint={t("regionHint")}
                    value={region}
                    onChange={handleRegionChange}
                    options={regions}
                />
            </section>

            <section aria-labelledby="language-heading" className="flex flex-col gap-3">
                <h2 id="language-heading" className={panelTitleClass}>
                    {t("languageHeading")}
                </h2>
                <NativeSelect
                    label={t("languageLabel")}
                    hint={t("languageHint")}
                    value={locale}
                    onChange={handleLanguageChange}
                    options={locales.map((code) => ({ value: code, label: localeNames[code] }))}
                />
            </section>

            <section aria-labelledby="theme-heading" className="flex flex-col gap-3">
                <h2 id="theme-heading" className={panelTitleClass}>
                    {t("themeHeading")}
                </h2>
                <ButtonGroup
                    aria-labelledby="theme-heading"
                    size="sm"
                    selectedKeys={[theme]}
                    disallowEmptySelection
                    onSelectionChange={handleThemeChange}
                >
                    {THEMES.map(({ id, icon }) => (
                        <ButtonGroupItem key={id} id={id} iconLeading={icon}>
                            {t(`themes.${id}`)}
                        </ButtonGroupItem>
                    ))}
                </ButtonGroup>
            </section>

            <p role="status" aria-live="polite" className="text-sm text-success-primary">
                {saved}
            </p>
        </div>
    );
};
