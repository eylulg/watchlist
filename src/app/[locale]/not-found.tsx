import { useTranslations } from "next-intl";
import { LinkButton } from "@/components/app/link-button";
import { EmptyResults } from "@/components/app/states";

export default function NotFound() {
    const t = useTranslations("NotFound");
    return (
        <EmptyResults
            title={t("title")}
            headingAs="h1"
            description={t("description")}
            actions={<LinkButton href="/">{t("home")}</LinkButton>}
        />
    );
}
