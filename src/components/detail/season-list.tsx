import { useTranslations } from "next-intl";
import { sectionTitleClass } from "@/components/app/styles";
import { Thumb } from "@/components/app/thumb";
import { Link } from "@/i18n/navigation";
import { type SeasonSummary, releaseYear, seasonHref } from "@/lib/tmdb/types";

export const SeasonList = ({ seriesId, seasons }: { seriesId: number; seasons: SeasonSummary[] }) => {
    const t = useTranslations("Detail");

    return (
        <section aria-labelledby="seasons" className="flex flex-col gap-4">
            <h2 id="seasons" className={sectionTitleClass}>
                {t("seasons")}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {seasons.map((season) => (
                    <li key={season.seasonNumber}>
                        <Link
                            href={seasonHref(seriesId, season.seasonNumber)}
                            className="group hover:bg-primary_hover flex items-center gap-3 rounded-xl p-2 ring-1 ring-default outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <Thumb path={season.posterPath} className="w-12 rounded-md" sizes="48px" />
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-primary group-hover:underline">{season.name}</span>
                                <span className="text-xs text-tertiary">
                                    {t("episodeCount", { count: season.episodeCount })}
                                    {releaseYear(season.airDate) && ` · ${releaseYear(season.airDate)}`}
                                </span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};
