import { Button } from "@eylulg/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { EmptyResults } from "@/components/app/states";
import { getPathname } from "@/i18n/navigation";

export default function NotFound() {
    const t = useTranslations("NotFound");
    const locale = useLocale();
    return (
        <EmptyResults
            title={t("title")}
            headingLevel={1}
            description={t("description")}
            actions={<Button href={getPathname({ href: "/", locale })}>{t("home")}</Button>}
        />
    );
}
