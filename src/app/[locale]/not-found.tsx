import { useTranslations } from "next-intl";
import { EmptyResults } from "@/components/app/states";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
    const t = useTranslations("NotFound");
    return (
        <EmptyResults
            title={t("title")}
            headingAs="h1"
            description={t("description")}
            actions={
                <Link
                    href="/"
                    className="rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white outline-focus-ring hover:bg-brand-solid_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    {t("home")}
                </Link>
            }
        />
    );
}
