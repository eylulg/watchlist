import { ArrowLeft } from "@untitledui/icons";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { inlineLinkClass, pageTitleClass, sectionTitleClass } from "@/components/app/styles";
import { Link } from "@/i18n/navigation";
import { tmdbImage } from "@/lib/tmdb/images";
import { type SeasonDetail, titleHref } from "@/lib/tmdb/types";
import { cx } from "@/utils/cx";

export const SeasonView = ({ season, seriesTitle }: { season: SeasonDetail; seriesTitle: string }) => {
    const t = useTranslations("Detail");
    const format = useFormatter();

    return (
        <article className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <Link
                    href={titleHref({ mediaType: "tv", id: season.seriesId })}
                    className={cx(inlineLinkClass, "flex items-center gap-1 self-start text-sm")}
                >
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
                            <li key={episode.id} className="flex flex-col gap-3 rounded-xl p-3 ring-1 ring-secondary sm:flex-row sm:gap-4">
                                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-tertiary sm:w-56">
                                    {episode.stillPath && (
                                        <Image
                                            src={tmdbImage(episode.stillPath, "w780")}
                                            alt=""
                                            fill
                                            sizes="(min-width: 640px) 224px, 100vw"
                                            className="object-cover"
                                        />
                                    )}
                                </div>
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
