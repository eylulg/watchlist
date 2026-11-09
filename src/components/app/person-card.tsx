import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { type PersonSummary, personHref } from "@/lib/tmdb/types";
import { Poster } from "./poster";
import { cardLinkClass, cardTitleClass, posterFrameClass } from "./styles";

interface PersonCardProps extends Pick<PersonSummary, "id" | "name" | "profilePath"> {
    /** A character, a job, or what the person is known for. */
    detail: string;
    sizes: string;
}

export const PersonCard = ({ id, name, profilePath, detail, sizes }: PersonCardProps) => {
    const t = useTranslations("Common");
    return (
        <article>
            <Link href={personHref(id)} data-card-link className={cardLinkClass}>
                <div className={posterFrameClass}>
                    <Poster path={profilePath} alt="" sizes={sizes} variant="profile" />
                </div>
                <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className={cardTitleClass}>{name}</h3>
                    <p className="line-clamp-2 text-xs text-tertiary">{detail || t("person")}</p>
                </div>
            </Link>
        </article>
    );
};
