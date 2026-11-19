import { Button } from "@eylulg/ui/button";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { FileQuestionMark } from "@/components/app/icons";
import { EmptyResults } from "@/components/app/states";
import { getPathname } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("NotFound");
    return { title: t("title") };
}

export default async function NotFound() {
    const t = await getTranslations("NotFound");
    const locale = await getLocale();
    return (
        <EmptyResults
            title={t("title")}
            headingLevel={1}
            description={t("description")}
            icon={FileQuestionMark}
            actions={<Button href={getPathname({ href: "/", locale })}>{t("home")}</Button>}
        />
    );
}
