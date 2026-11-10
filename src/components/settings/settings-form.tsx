"use client";

import { useState } from "react";
import { Select, SelectItem } from "@eylulg/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { panelTitleClass } from "@/components/app/styles";
import { isLocale, localeNames, locales } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { WATCH_REGIONS, isRegionCode, regionName, writeRegionCookie } from "@/lib/regions";

export const SettingsForm = ({ region: initialRegion }: { region: string }) => {
    const t = useTranslations("Settings");
    const tr = useTranslations("Regions");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [region, setRegion] = useState(initialRegion);
    const [saved, setSaved] = useState("");

    const regions = [...new Set<string>([...WATCH_REGIONS, initialRegion])]
        .map((code) => ({ id: code, name: regionName(tr, code) }))
        .sort((a, b) => a.name.localeCompare(b.name, locale));
    const languages = locales.map((code) => ({ id: code, name: localeNames[code] }));

    function handleRegionChange(key: unknown) {
        if (typeof key !== "string" || !isRegionCode(key)) return;
        setRegion(key);
        writeRegionCookie(key);
        setSaved(t("regionSaved", { region: regionName(tr, key) }));
        // Server components read the cookie; refresh so detail pages pick it up.
        router.refresh();
    }

    function handleLanguageChange(key: unknown) {
        if (typeof key === "string" && isLocale(key)) router.replace(pathname, { locale: key });
    }

    return (
        <div className="flex max-w-xl flex-col gap-8">
            <section aria-labelledby="region-heading" className="flex flex-col gap-3">
                <h2 id="region-heading" className={panelTitleClass}>
                    {t("regionHeading")}
                </h2>
                <Select label={t("regionLabel")} hint={t("regionHint")} value={region} onChange={handleRegionChange} items={regions}>
                    {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
                </Select>
            </section>

            <section aria-labelledby="language-heading" className="flex flex-col gap-3">
                <h2 id="language-heading" className={panelTitleClass}>
                    {t("languageHeading")}
                </h2>
                <Select
                    label={t("languageLabel")}
                    hint={t("languageHint")}
                    value={locale}
                    onChange={handleLanguageChange}
                    items={languages}
                >
                    {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
                </Select>
            </section>

            <p role="status" aria-live="polite" className="text-sm text-success">
                {saved}
            </p>
        </div>
    );
};
