import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { getRegion } from "@/lib/preferences";
import { resolveLocale } from "@/lib/route-params";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const t = await getTranslations({ locale: resolveLocale((await params).locale), namespace: "Settings" });
    return { title: t("title") };
}

export default async function SettingsPage({ params }: PageProps) {
    const locale = resolveLocale((await params).locale);
    const t = await getTranslations("Settings");
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">{t("title")}</h1>
                <p className="text-md text-tertiary">{t("intro")}</p>
            </div>
            <SettingsForm region={await getRegion(locale)} />
        </div>
    );
}
