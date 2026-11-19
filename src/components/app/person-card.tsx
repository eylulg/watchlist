import { Card, CardHeader } from "@eylulg/ui/card";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { type PersonSummary, personHref } from "@/lib/tmdb/types";
import { Poster } from "./poster";
import { cardClass } from "./styles";

interface PersonCardProps extends Pick<PersonSummary, "id" | "name" | "profilePath"> {
    /** A character, a job, or what the person is known for. */
    detail: string;
    sizes: string;
}

export const PersonCard = ({ id, name, profilePath, detail, sizes }: PersonCardProps) => {
    const t = useTranslations("Common");
    const locale = useLocale();
    return (
        <Card href={getPathname({ href: personHref(id), locale })} padding="none" className={cardClass}>
            <Poster path={profilePath} alt="" sizes={sizes} variant="profile" isFlush />
            <CardHeader
                title={name}
                description={<span className="line-clamp-2 text-xs">{detail || t("person")}</span>}
                className="p-card"
            />
        </Card>
    );
};
