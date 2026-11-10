import { Badge } from "@eylulg/ui/badge";
import { Skeleton } from "@eylulg/ui/skeleton";
import { useFormatter, useTranslations } from "next-intl";
import { Carousel } from "@/components/app/carousel";
import { Star } from "@/components/app/icons";
import { PersonCard } from "@/components/app/person-card";
import { Poster } from "@/components/app/poster";
import { inlineLinkClass, pageTitleClass, sectionTitleClass } from "@/components/app/styles";
import { TitleCard } from "@/components/app/title-card";
import { WatchlistControl } from "@/components/app/watchlist-control";
import { Link } from "@/i18n/navigation";
import { DETAIL_POSTER_SIZES, ROW_POSTER_SIZES } from "@/lib/tmdb/images";
import { type TitleDetail, collectionHref, personHref, releaseYear } from "@/lib/tmdb/types";
import { ProvidersPanel } from "./providers-panel";
import { SeasonList } from "./season-list";
import { VideoList } from "./video-list";

interface TitleDetailViewProps {
    detail: TitleDetail;
    region: string;
}

/** Estimated minutes for the whole title, for watchlist stats. */
const totalRuntime = (detail: TitleDetail): number | null => {
    if (detail.mediaType === "movie") return detail.runtime;
    if (!detail.episodeRuntime || !detail.numberOfEpisodes) return null;
    return detail.episodeRuntime * detail.numberOfEpisodes;
};

export const TitleDetailView = ({ detail, region }: TitleDetailViewProps) => {
    const t = useTranslations("Detail");
    const tc = useTranslations("Common");
    const format = useFormatter();
    const year = releaseYear(detail.releaseDate);
    const runtime = detail.mediaType === "movie" ? detail.runtime : detail.episodeRuntime;
    const collection = detail.mediaType === "movie" ? detail.collection : null;

    const facts: string[] = [tc(detail.mediaType === "movie" ? "movie" : "series")];
    if (year) facts.push(year);
    if (runtime) facts.push(detail.mediaType === "movie" ? t("runtime", { minutes: runtime }) : t("episodeRuntime", { minutes: runtime }));
    if (detail.mediaType === "tv" && detail.numberOfSeasons) facts.push(t("seasonCount", { count: detail.numberOfSeasons }));

    return (
        <article className="flex flex-col gap-10 md:gap-12">
            <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                <div className="w-48 shrink-0 self-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-default md:w-72 md:self-start">
                    <Poster path={detail.posterPath} alt={t("posterAlt", { title: detail.title })} sizes={DETAIL_POSTER_SIZES} priority />
                </div>
                <div className="flex min-w-0 flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <h1 className={pageTitleClass}>{detail.title}</h1>
                        {detail.tagline && <p className="text-lg text-tertiary italic">{detail.tagline}</p>}
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tertiary">
                            {facts.map((fact, i) => (
                                <span key={fact} className="flex items-center gap-2">
                                    {i > 0 && <span aria-hidden="true">·</span>}
                                    {fact}
                                </span>
                            ))}
                            {detail.voteCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <span aria-hidden="true">·</span>
                                    <Star aria-hidden="true" className="size-4 fill-current text-warning-400" />
                                    {t("rating", { rating: detail.rating.toFixed(1), votes: format.number(detail.voteCount) })}
                                </span>
                            )}
                        </p>
                    </div>

                    {detail.genres.length > 0 && (
                        <ul aria-label={t("genres")} className="flex flex-wrap gap-2">
                            {detail.genres.map((genre) => (
                                <li key={genre.id}>
                                    <Badge color="gray" size="md">
                                        {genre.name}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}

                    <WatchlistControl
                        title={{
                            id: detail.id,
                            mediaType: detail.mediaType,
                            title: detail.title,
                            posterPath: detail.posterPath,
                            releaseDate: detail.releaseDate,
                        }}
                        runtime={totalRuntime(detail)}
                    />

                    <div className="flex flex-col gap-2">
                        <h2 className="text-md font-semibold text-primary">{t("overview")}</h2>
                        <p className="max-w-prose text-md text-secondary">{detail.overview || t("noOverview")}</p>
                    </div>

                    {detail.crew.length > 0 && (
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {detail.crew.map((person) => (
                                <div key={person.id}>
                                    <dt className="text-sm text-tertiary">{person.jobs.join(", ")}</dt>
                                    <dd>
                                        <Link
                                            href={personHref(person.id)}
                                            className="text-sm font-semibold text-primary underline-offset-2 outline-focus hover:underline focus-visible:outline-2"
                                        >
                                            {person.name}
                                        </Link>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    {collection && (
                        <p className="text-sm text-secondary">
                            {t.rich("partOf", {
                                link: (chunks) => (
                                    <Link href={collectionHref(collection.id)} className={inlineLinkClass}>
                                        {chunks}
                                    </Link>
                                ),
                                name: collection.name,
                            })}
                        </p>
                    )}
                </div>
            </div>

            <ProvidersPanel providers={detail.providers} region={region} title={detail.title} />

            {detail.mediaType === "tv" && detail.seasons.length > 0 && <SeasonList seriesId={detail.id} seasons={detail.seasons} />}

            {detail.cast.length > 0 ? (
                <Carousel title={t("cast")}>
                    {detail.cast.map((member) => (
                        <li key={member.id}>
                            <PersonCard
                                id={member.id}
                                name={member.name}
                                profilePath={member.profilePath}
                                detail={member.character}
                                sizes={ROW_POSTER_SIZES}
                            />
                        </li>
                    ))}
                </Carousel>
            ) : (
                <section aria-labelledby="cast-empty" className="flex flex-col gap-2">
                    <h2 id="cast-empty" className={sectionTitleClass}>
                        {t("cast")}
                    </h2>
                    <p className="text-sm text-tertiary">{t("noCast")}</p>
                </section>
            )}

            <VideoList videos={detail.videos} />

            {detail.recommendations.length > 0 && (
                <Carousel title={t("recommendations")}>
                    {detail.recommendations.map((title) => (
                        <li key={`${title.mediaType}-${String(title.id)}`}>
                            <TitleCard title={title} sizes={ROW_POSTER_SIZES} />
                        </li>
                    ))}
                </Carousel>
            )}
        </article>
    );
};

export const DetailSkeleton = () => (
    <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <Skeleton shape="rect" className="aspect-2/3 h-auto w-48 shrink-0 self-center rounded-2xl md:w-72 md:self-start" />
        <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton shape="rect" className="h-control-md w-48" />
            <Skeleton shape="rect" className="h-24 max-w-prose" />
        </div>
    </div>
);
