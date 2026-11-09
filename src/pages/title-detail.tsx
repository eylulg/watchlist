import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Heart, Star01 } from "@untitledui/icons";
import { useParams } from "react-router";
import { titleDetailQuery } from "@/api/queries";
import { MEDIA_LABEL, type MediaType, type TitleDetail, TmdbError, releaseYear } from "@/api/tmdb";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Poster } from "@/components/catalogue/poster";
import { ErrorState } from "@/components/catalogue/status-states";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFavorites } from "@/lib/favorites";
import { backdropSources, profileSources } from "@/lib/images";
import { listPath } from "@/lib/paths";
import { cx } from "@/utils/cx";
import { NotFoundPage } from "./not-found";

const isMediaType = (value: string | undefined): value is MediaType => value === "movie" || value === "tv";

const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${String(h)}h ${String(m)}m` : `${String(m)}m`;
};

const formatDate = (date: string) => {
    const parsed = new Date(`${date}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
        ? ""
        : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

const DetailSkeleton = () => (
    <div role="status" aria-label="Loading title" className="grid gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div className="mx-auto aspect-2/3 w-full max-w-72 animate-pulse rounded-2xl bg-tertiary motion-reduce:animate-none" />
        <div className="flex flex-col gap-4">
            <div className="h-9 w-3/4 animate-pulse rounded bg-tertiary motion-reduce:animate-none" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-tertiary motion-reduce:animate-none" />
            <div className="h-24 w-full animate-pulse rounded bg-tertiary motion-reduce:animate-none" />
        </div>
    </div>
);

const FavoriteButton = ({ detail }: { detail: TitleDetail }) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const active = isFavorite(detail);

    return (
        <Button
            color={active ? "secondary" : "primary"}
            size="md"
            aria-pressed={active}
            iconLeading={<Heart data-icon aria-hidden="true" className={cx(active && "fill-current text-fg-error-primary")} />}
            onClick={() => {
                toggleFavorite({
                    id: detail.id,
                    mediaType: detail.mediaType,
                    title: detail.title,
                    overview: detail.overview,
                    posterPath: detail.posterPath,
                    releaseDate: detail.releaseDate,
                    rating: detail.rating,
                    voteCount: detail.voteCount,
                    genreIds: detail.genres.map((g) => g.id),
                });
            }}
        >
            {active ? "In favorites" : "Add to favorites"}
        </Button>
    );
};

const CastList = ({ detail }: { detail: TitleDetail }) => (
    <section aria-labelledby="cast-heading" className="flex flex-col gap-4">
        <h2 id="cast-heading" className="text-lg font-semibold text-primary">
            Top cast
        </h2>
        {detail.cast.length === 0 ? (
            <p className="text-sm text-tertiary">Cast information is not available for this title.</p>
        ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {detail.cast.map((person) => {
                    const photo = person.profilePath ? profileSources(person.profilePath) : null;
                    return (
                        <li key={person.id} className="flex min-w-0 items-center gap-3">
                            <Avatar
                                size="lg"
                                src={photo?.src}
                                srcSet={photo?.srcSet}
                                sizes="48px"
                                alt={person.name}
                                initials={initials(person.name)}
                            />
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold text-primary">{person.name}</span>
                                <span className="truncate text-sm text-tertiary">{person.character || "Role not listed"}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        )}
    </section>
);

const Detail = ({ mediaType, id }: { mediaType: MediaType; id: number }) => {
    const { data, isPending, isError, error, refetch } = useQuery(titleDetailQuery(mediaType, id));
    useDocumentTitle(data?.title ?? MEDIA_LABEL[mediaType].singular);
    const backLabel = mediaType === "movie" ? "Movies" : "Series";

    const back = (
        <Button href={listPath[mediaType]} color="link-gray" size="sm" iconLeading={ArrowLeft} className="mb-6">
            {backLabel}
        </Button>
    );

    if (isPending) {
        return (
            <>
                {back}
                <DetailSkeleton />
            </>
        );
    }
    if (isError) {
        if (error instanceof TmdbError && error.status === 404) {
            return <NotFoundPage title="Title not found" description={`TMDB has no ${MEDIA_LABEL[mediaType].singular} with this id.`} />;
        }
        return (
            <>
                {back}
                <ErrorState
                    title="We could not load this title"
                    error={error}
                    onRetry={() => {
                        void refetch();
                    }}
                />
            </>
        );
    }

    const year = releaseYear(data.releaseDate);
    const releaseLabel = formatDate(data.releaseDate);
    const backdrop = data.backdropPath ? backdropSources(data.backdropPath) : null;

    return (
        <article className="relative">
            {backdrop && (
                <img
                    src={backdrop.src}
                    srcSet={backdrop.srcSet}
                    sizes="100vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-72 w-full mask-b-from-10% object-cover opacity-15 blur-sm"
                />
            )}
            {back}
            <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-12">
                <div className="mx-auto w-full max-w-60 md:max-w-none">
                    <Poster
                        path={data.posterPath}
                        alt={`Poster of ${data.title}`}
                        sizes="(min-width: 768px) 288px, 240px"
                        priority
                        className="rounded-2xl shadow-lg ring-1 ring-secondary"
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-6">
                    <header className="flex flex-col gap-2">
                        <h1 className="text-display-xs font-semibold text-primary md:text-display-md">
                            {data.title}
                            {year && <span className="font-normal text-tertiary"> ({year})</span>}
                        </h1>
                        {data.tagline && <p className="text-lg text-tertiary italic">{data.tagline}</p>}
                    </header>

                    <dl className="flex flex-wrap items-center gap-2">
                        <div className="contents">
                            <dt className="sr-only">Rating</dt>
                            <dd>
                                {data.voteCount > 0 ? (
                                    <BadgeWithIcon type="pill-color" color="warning" size="md" iconLeading={Star01}>
                                        {data.rating.toFixed(1)} / 10 from {data.voteCount.toLocaleString("en-US")} votes
                                    </BadgeWithIcon>
                                ) : (
                                    <Badge type="pill-color" color="gray" size="md">
                                        Not rated yet
                                    </Badge>
                                )}
                            </dd>
                        </div>
                        {data.runtime !== null && (
                            <div className="contents">
                                <dt className="sr-only">{mediaType === "movie" ? "Runtime" : "Episode length"}</dt>
                                <dd>
                                    <BadgeWithIcon type="pill-color" color="gray" size="md" iconLeading={Clock}>
                                        {formatRuntime(data.runtime)}
                                        {mediaType === "tv" ? " per episode" : ""}
                                    </BadgeWithIcon>
                                </dd>
                            </div>
                        )}
                        {data.seasons !== null && (
                            <div className="contents">
                                <dt className="sr-only">Seasons</dt>
                                <dd>
                                    <Badge type="pill-color" color="gray" size="md">
                                        {data.seasons} {data.seasons === 1 ? "season" : "seasons"}
                                    </Badge>
                                </dd>
                            </div>
                        )}
                        {releaseLabel && (
                            <div className="contents">
                                <dt className="sr-only">{mediaType === "movie" ? "Released" : "First aired"}</dt>
                                <dd className="text-sm text-tertiary">{releaseLabel}</dd>
                            </div>
                        )}
                    </dl>

                    {data.genres.length > 0 && (
                        <ul aria-label="Genres" className="flex flex-wrap gap-2">
                            {data.genres.map((genre) => (
                                <li key={genre.id}>
                                    <Badge type="color" color="brand" size="md">
                                        {genre.name}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}

                    <section aria-labelledby="overview-heading" className="flex flex-col gap-2">
                        <h2 id="overview-heading" className="text-lg font-semibold text-primary">
                            Overview
                        </h2>
                        <p className="max-w-prose text-md text-secondary">
                            {data.overview || "No overview is available for this title yet."}
                        </p>
                    </section>

                    <div>
                        <FavoriteButton detail={data} />
                    </div>

                    <CastList detail={data} />
                </div>
            </div>
        </article>
    );
};

export const TitleDetailPage = () => {
    const params = useParams();
    const id = Number(params.id);

    if (!isMediaType(params.mediaType) || !Number.isInteger(id) || id <= 0) {
        return <NotFoundPage />;
    }
    return <Detail key={`${params.mediaType}-${String(id)}`} mediaType={params.mediaType} id={id} />;
};
