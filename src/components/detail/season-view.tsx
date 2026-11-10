import { cx } from "@eylulg/ui/cx";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft } from "@/components/app/icons";
import { backLinkClass, pageTitleClass, sectionTitleClass, stableHeightClass } from "@/components/app/styles";
import { Thumb } from "@/components/app/thumb";
import { Link } from "@/i18n/navigation";
import { type SeasonDetail, titleHref } from "@/lib/tmdb/types";

export const SeasonView = ({ season, seriesTitle }: { season: SeasonDetail; seriesTitle: string }) => {
    const t = useTranslations("Detail");
    const format = useFormatter();

    return (
        <article className={cx(stableHeightClass, "flex flex-col gap-8")}>
            <div className="flex flex-col gap-2">
                <Link href={titleHref({ mediaType: "tv", id: season.seriesId })} className={backLinkClass}>
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    {seriesTitle}
                </Link>
                <h1 className={pageTitleClass}>{season.name}</h1>
                <p className="text-sm text-tertiary">{t("episodeCount", { count: season.episodes.length })}</p>
                {season.overview && <p className="max-w-prose text-md text-secondary">{season.overview}</p>}
            </div>

            <section aria-labelledby="episodes" className="flex flex-col gap-4">
                <h2 id="episodes" className={sectionTitleClass}>
                    {t("episodes")}
                </h2>
                {season.episodes.length === 0 ? (
                    <p className="text-sm text-tertiary">{t("noEpisodes")}</p>
                ) : (
                    <ol className="flex flex-col gap-4">
                        {season.episodes.map((episode) => (
                            <li key={episode.id} className="flex flex-col gap-3 rounded-xl p-3 ring-1 ring-default sm:flex-row sm:gap-4">
                                <Thumb
                                    path={episode.stillPath}
                                    isWide
                                    className="w-full rounded-lg sm:w-56"
                                    sizes="(min-width: 640px) 224px, 100vw"
                                    imageSize="w780"
                                />
                                <div className="flex min-w-0 flex-col gap-1">
                                    <h3 className="text-md font-semibold text-primary">
                                        <span className="text-tertiary">{t("episodeNumber", { number: episode.episodeNumber })}</span>{" "}
                                        {episode.name}
                                    </h3>
                                    <p className="text-xs text-tertiary">
                                        {[
                                            episode.airDate ? format.dateTime(new Date(episode.airDate), { dateStyle: "medium" }) : null,
                                            episode.runtime ? t("runtime", { minutes: episode.runtime }) : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                    <p className="text-sm text-secondary">{episode.overview || t("noOverview")}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </article>
    );
};
