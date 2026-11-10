import { useFormatter, useTranslations } from "next-intl";
import { Poster } from "@/components/app/poster";
import { pageTitleClass, sectionTitleClass } from "@/components/app/styles";
import { Thumb } from "@/components/app/thumb";
import { Link } from "@/i18n/navigation";
import { DETAIL_POSTER_SIZES } from "@/lib/tmdb/images";
import { type PersonDetail, titleHref } from "@/lib/tmdb/types";

export const PersonView = ({ person }: { person: PersonDetail }) => {
    const t = useTranslations("Person");
    const tc = useTranslations("Common");
    const format = useFormatter();
    const date = (value: string) => format.dateTime(new Date(value), { dateStyle: "long" });
    const paragraphs = person.biography.split(/\n\s*\n/).filter(Boolean);
    const creditCount = person.filmography.reduce((sum, year) => sum + year.credits.length, 0);

    return (
        <article className="flex flex-col gap-10">
            <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                <div className="w-48 shrink-0 self-center overflow-hidden rounded-2xl ring-1 ring-default md:w-64 md:self-start">
                    <Poster
                        path={person.profilePath}
                        alt={t("photoAlt", { name: person.name })}
                        sizes={DETAIL_POSTER_SIZES}
                        variant="profile"
                        priority
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                    <h1 className={pageTitleClass}>{person.name}</h1>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                        {person.knownForDepartment && (
                            <div>
                                <dt className="text-tertiary">{t("knownFor")}</dt>
                                <dd className="font-medium text-primary">{person.knownForDepartment}</dd>
                            </div>
                        )}
                        {person.birthday && (
                            <div>
                                <dt className="text-tertiary">{t("born")}</dt>
                                <dd className="font-medium text-primary">
                                    {date(person.birthday)}
                                    {person.placeOfBirth && `, ${person.placeOfBirth}`}
                                </dd>
                            </div>
                        )}
                        {person.deathday && (
                            <div>
                                <dt className="text-tertiary">{t("died")}</dt>
                                <dd className="font-medium text-primary">{date(person.deathday)}</dd>
                            </div>
                        )}
                    </dl>
                    <section aria-labelledby="biography" className="flex flex-col gap-2">
                        <h2 id="biography" className="text-md font-semibold text-primary">
                            {t("biography")}
                        </h2>
                        {paragraphs.length > 0 ? (
                            paragraphs.map((paragraph, i) => (
                                <p key={i} className="max-w-prose text-md text-secondary">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-md text-tertiary">{t("noBiography")}</p>
                        )}
                    </section>
                </div>
            </div>

            <section aria-labelledby="filmography" className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h2 id="filmography" className={sectionTitleClass}>
                        {t("filmography")}
                    </h2>
                    <p className="text-sm text-tertiary">{t("creditCount", { count: creditCount })}</p>
                </div>
                {person.filmography.map((group) => (
                    <section
                        key={group.year ?? "undated"}
                        aria-labelledby={`year-${String(group.year ?? "undated")}`}
                        className="flex flex-col gap-3 sm:flex-row sm:gap-6"
                    >
                        <h3
                            id={`year-${String(group.year ?? "undated")}`}
                            className="w-24 shrink-0 text-md font-semibold text-secondary tabular-nums"
                        >
                            {group.year ?? t("undated")}
                        </h3>
                        <ul className="flex min-w-0 flex-1 flex-col gap-2">
                            {group.credits.map((credit) => (
                                <li key={`${credit.mediaType}-${String(credit.id)}`}>
                                    <Link
                                        href={titleHref(credit)}
                                        className="group hover:bg-primary_hover flex items-center gap-3 rounded-lg p-1 outline-focus focus-visible:outline-2"
                                    >
                                        <Thumb path={credit.posterPath} className="w-10 rounded" sizes="40px" imageSize="w92" />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-semibold text-primary group-hover:underline">
                                                {credit.title}
                                            </span>
                                            <span className="truncate text-xs text-tertiary">
                                                {tc(credit.mediaType === "movie" ? "movie" : "series")}
                                                {credit.roles.length > 0 && ` · ${credit.roles.join(", ")}`}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </section>
        </article>
    );
};
