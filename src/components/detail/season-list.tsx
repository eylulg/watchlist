import { useTranslations } from "next-intl";
import Image from "next/image";
import { sectionTitleClass } from "@/components/app/styles";
import { Link } from "@/i18n/navigation";
import { tmdbImage } from "@/lib/tmdb/images";
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
                            className="group flex items-center gap-3 rounded-xl p-2 ring-1 ring-secondary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <div className="relative aspect-2/3 w-12 shrink-0 overflow-hidden rounded-md bg-tertiary">
                                {season.posterPath && (
                                    <Image src={tmdbImage(season.posterPath, "w185")} alt="" fill sizes="48px" className="object-cover" />
                                )}
                            </div>
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
