import "server-only";
import type { z } from "zod";
import { type AppLocale, tmdbLanguage } from "@/i18n/config";
import {
    type RawCombinedCredit,
    type RawCredits,
    type RawMovieListItem,
    type RawPersonListItem,
    type RawTvListItem,
    type RawVideos,
    type RawWatchProviders,
    collectionDetailSchema,
    movieDetailSchema,
    movieListItemSchema,
    multiItemSchema,
    pagedSchema,
    personDetailSchema,
    personListItemSchema,
    seasonDetailSchema,
    tvDetailSchema,
    tvListItemSchema,
} from "./schemas";
import type {
    CastMember,
    CollectionDetail,
    CrewMember,
    FilmographyCredit,
    FilmographyYear,
    MediaType,
    MovieDetail,
    Paged,
    PersonDetail,
    PersonSummary,
    RegionProviders,
    SearchKind,
    SearchResult,
    SeasonDetail,
    SeriesDetail,
    TitleSummary,
    Video,
    WatchProvider,
} from "./types";

export { SEARCH_KINDS, type SearchKind } from "./types";

export const DEFAULT_TMDB_API_BASE = "https://api.themoviedb.org/3";

/** TMDB never serves more than 500 pages for list endpoints. */
export const TMDB_MAX_PAGE = 500;

/** Revalidate times in seconds for Next's fetch cache. TMDB data changes slowly, so cache generously. */
export const REVALIDATE = {
    trending: 60 * 60,
    lists: 6 * 60 * 60,
    search: 10 * 60,
    detail: 12 * 60 * 60,
} as const;

export class TmdbError extends Error {
    readonly status: number | undefined;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "TmdbError";
        this.status = status;
    }
}

export const isNotFound = (error: unknown) => error instanceof TmdbError && error.status === 404;

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

type QueryValue = string | number | boolean | undefined | null;

/** Read on every call so tests and the e2e mock server can change it. Never exposed to the client. */
const getCredential = (): string => {
    const key = process.env.TMDB_API_KEY?.trim();
    if (!key) {
        throw new TmdbError("The TMDB API key is missing. Set TMDB_API_KEY in your environment.");
    }
    return key;
};

const getApiBase = () => process.env.TMDB_API_BASE_URL?.trim() || DEFAULT_TMDB_API_BASE;

/** v4 read access tokens are JWTs, v3 API keys are 32 hex characters. */
const isV4Token = (credential: string) => credential.startsWith("eyJ");

export const buildUrl = (path: string, params: Record<string, QueryValue> = {}, credential = getCredential()): URL => {
    const url = new URL(`${getApiBase()}${path}`);
    for (const [name, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
    }
    if (!isV4Token(credential)) url.searchParams.set("api_key", credential);
    return url;
};

interface FetchOptions {
    params?: Record<string, QueryValue>;
    /** Seconds before Next's data cache revalidates this response. */
    revalidate: number;
    tags?: string[];
}

export const tmdbFetch = async <T extends z.ZodType>(
    path: string,
    schema: T,
    { params = {}, revalidate, tags = [] }: FetchOptions,
): Promise<z.infer<T>> => {
    const credential = getCredential();
    const headers: HeadersInit = { Accept: "application/json" };
    if (isV4Token(credential)) headers.Authorization = `Bearer ${credential}`;

    let response: Response;
    try {
        response = await fetch(buildUrl(path, params, credential), {
            headers,
            next: { revalidate, tags: ["tmdb", ...tags] },
        });
    } catch {
        throw new TmdbError("Could not reach TMDB. Check your connection and try again.");
    }

    if (!response.ok) {
        let message = `TMDB request failed with status ${response.status}.`;
        try {
            const body = (await response.json()) as { status_message?: unknown };
            if (typeof body.status_message === "string") message = body.status_message;
        } catch {
            // Non JSON error body: keep the generic message.
        }
        throw new TmdbError(message, response.status);
    }

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
        throw new TmdbError("TMDB returned data in an unexpected format.");
    }
    return parsed.data;
};

const language = (locale: AppLocale) => tmdbLanguage[locale];
const isEnglish = (locale: AppLocale) => locale === "en";

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

export const toMovieSummary = (m: RawMovieListItem): TitleSummary => ({
    id: m.id,
    mediaType: "movie",
    title: m.title,
    overview: m.overview,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path,
    releaseDate: m.release_date,
    rating: m.vote_average,
    voteCount: m.vote_count,
});

export const toTvSummary = (t: RawTvListItem): TitleSummary => ({
    id: t.id,
    mediaType: "tv",
    title: t.name,
    overview: t.overview,
    posterPath: t.poster_path,
    backdropPath: t.backdrop_path,
    releaseDate: t.first_air_date,
    rating: t.vote_average,
    voteCount: t.vote_count,
});

export const toPersonSummary = (p: RawPersonListItem): PersonSummary => ({
    id: p.id,
    mediaType: "person",
    name: p.name,
    profilePath: p.profile_path,
    knownForDepartment: p.known_for_department,
    knownFor: p.known_for.flatMap((k) => k.title ?? k.name ?? []).slice(0, 3),
});

const toMultiItem = (item: z.infer<typeof multiItemSchema>): SearchResult => {
    switch (item.media_type) {
        case "movie":
            return toMovieSummary(item);
        case "tv":
            return toTvSummary(item);
        case "person":
            return toPersonSummary(item);
    }
};

const toPaged = <I, O>(
    data: { page: number; results: I[]; total_pages: number; total_results: number },
    map: (item: I) => O,
): Paged<O> => ({
    page: data.page,
    results: data.results.map(map),
    totalPages: Math.min(data.total_pages, TMDB_MAX_PAGE),
    totalResults: data.total_results,
});

export const toCast = (cast: RawCredits["cast"], limit = 12): CastMember[] =>
    [...cast]
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        .slice(0, limit)
        .map((c) => ({ id: c.id, name: c.name, character: c.character, profilePath: c.profile_path }));

/** The jobs worth showing on a detail page, in display order. */
const KEY_JOBS = [
    "Creator",
    "Director",
    "Screenplay",
    "Writer",
    "Story",
    "Novel",
    "Original Music Composer",
    "Director of Photography",
    "Editor",
    "Producer",
    "Executive Producer",
];

/** Picks the key crew, merges several jobs of one person, and orders them by the most important job. */
export const toCrew = (
    crew: RawCredits["crew"],
    creators: { id: number; name: string; profile_path: string | null }[] = [],
    limit = 8,
): CrewMember[] => {
    const people = new Map<number, CrewMember & { rank: number }>();
    const add = (id: number, name: string, job: string, profilePath: string | null) => {
        const rank = KEY_JOBS.indexOf(job);
        if (rank === -1) return;
        const existing = people.get(id);
        if (existing) {
            if (!existing.jobs.includes(job)) existing.jobs.push(job);
            existing.rank = Math.min(existing.rank, rank);
        } else {
            people.set(id, { id, name, jobs: [job], profilePath, rank });
        }
    };
    for (const creator of creators) add(creator.id, creator.name, "Creator", creator.profile_path);
    for (const member of crew) add(member.id, member.name, member.job, member.profile_path);
    return [...people.values()]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit)
        .map(({ rank: _rank, jobs, ...person }) => ({
            ...person,
            jobs: [...jobs].sort((a, b) => KEY_JOBS.indexOf(a) - KEY_JOBS.indexOf(b)),
        }));
};

const VIDEO_TYPE_ORDER = ["Trailer", "Teaser", "Clip", "Featurette", "Behind the Scenes"];

/** YouTube and Vimeo videos only, trailers first, official before fan uploads. */
export const toVideos = (videos: RawVideos, limit = 8): Video[] =>
    videos.results
        .filter((v): v is typeof v & { site: "YouTube" | "Vimeo" } => v.site === "YouTube" || v.site === "Vimeo")
        .map((v, index) => ({ v, index }))
        .sort((a, b) => {
            const typeRank = (type: string) => {
                const rank = VIDEO_TYPE_ORDER.indexOf(type);
                return rank === -1 ? VIDEO_TYPE_ORDER.length : rank;
            };
            return (
                typeRank(a.v.type) - typeRank(b.v.type) ||
                Number(b.v.official ?? false) - Number(a.v.official ?? false) ||
                a.index - b.index
            );
        })
        .slice(0, limit)
        .map(({ v }) => ({
            key: v.key,
            name: v.name,
            site: v.site,
            type: v.type,
            url:
                v.site === "YouTube"
                    ? `https://www.youtube.com/watch?v=${encodeURIComponent(v.key)}`
                    : `https://vimeo.com/${encodeURIComponent(v.key)}`,
            thumbnailUrl: v.site === "YouTube" ? `https://i.ytimg.com/vi/${encodeURIComponent(v.key)}/hqdefault.jpg` : null,
        }));

const toProviderList = (list: RawWatchProviders["results"][string]["flatrate"]): WatchProvider[] =>
    [...list]
        .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
        .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));

export const toProviders = (raw: RawWatchProviders): Record<string, RegionProviders> =>
    Object.fromEntries(
        Object.entries(raw.results).map(([region, offers]) => [
            region,
            {
                link: offers.link,
                flatrate: toProviderList(offers.flatrate),
                free: toProviderList(offers.free),
                ads: toProviderList(offers.ads),
                rent: toProviderList(offers.rent),
                buy: toProviderList(offers.buy),
            },
        ]),
    );

/** Merges cast and crew credits per title, then groups them by year, newest first. Undated titles come first. */
export const toFilmography = (cast: RawCombinedCredit[], crew: RawCombinedCredit[]): FilmographyYear[] => {
    const titles = new Map<string, FilmographyCredit>();
    for (const credit of [...cast, ...crew]) {
        const key = `${credit.media_type}:${String(credit.id)}`;
        const role = credit.character?.trim() || credit.job?.trim() || "";
        const existing = titles.get(key);
        if (existing) {
            if (role && !existing.roles.includes(role)) existing.roles.push(role);
            continue;
        }
        titles.set(key, {
            id: credit.id,
            mediaType: credit.media_type,
            title: credit.title ?? credit.name ?? "",
            posterPath: credit.poster_path,
            releaseDate: (credit.media_type === "movie" ? credit.release_date : credit.first_air_date) ?? "",
            roles: role ? [role] : [],
        });
    }

    const byYear = new Map<number | null, FilmographyCredit[]>();
    for (const credit of titles.values()) {
        const year = /^\d{4}/.test(credit.releaseDate) ? Number(credit.releaseDate.slice(0, 4)) : null;
        byYear.set(year, [...(byYear.get(year) ?? []), credit]);
    }

    return [...byYear.entries()]
        .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : b - a))
        .map(([year, credits]) => ({
            year,
            credits: credits.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.title.localeCompare(b.title)),
        }));
};

/* ------------------------------------------------------------------ */
/* Lists and search                                                    */
/* ------------------------------------------------------------------ */

const movieListSchema = pagedSchema(movieListItemSchema);
const tvListSchema = pagedSchema(tvListItemSchema);
const personListSchema = pagedSchema(personListItemSchema);
const multiListSchema = pagedSchema(multiItemSchema);

export type TimeWindow = "day" | "week";

/** Trending movies and series together. People are filtered out. */
export const getTrending = async (locale: AppLocale, timeWindow: TimeWindow = "week"): Promise<Paged<TitleSummary>> => {
    const data = await tmdbFetch(`/trending/all/${timeWindow}`, multiListSchema, {
        params: { language: language(locale) },
        revalidate: REVALIDATE.trending,
        tags: ["tmdb:trending"],
    });
    const paged = toPaged(data, toMultiItem);
    return { ...paged, results: paged.results.filter((r): r is TitleSummary => r.mediaType !== "person") };
};

export type ListKind = "popular" | "top_rated";

export const getList = async (mediaType: MediaType, kind: ListKind, locale: AppLocale, page = 1): Promise<Paged<TitleSummary>> => {
    const options = { params: { language: language(locale), page }, revalidate: REVALIDATE.lists, tags: ["tmdb:lists"] };
    return mediaType === "movie"
        ? toPaged(await tmdbFetch(`/movie/${kind}`, movieListSchema, options), toMovieSummary)
        : toPaged(await tmdbFetch(`/tv/${kind}`, tvListSchema, options), toTvSummary);
};

export const search = async ({
    kind,
    query,
    page,
    locale,
}: {
    kind: SearchKind;
    query: string;
    page: number;
    locale: AppLocale;
}): Promise<Paged<SearchResult>> => {
    const options = {
        params: { query, page, include_adult: false, language: language(locale) },
        revalidate: REVALIDATE.search,
        tags: ["tmdb:search"],
    };
    switch (kind) {
        case "multi":
            return toPaged(await tmdbFetch("/search/multi", multiListSchema, options), toMultiItem);
        case "movie":
            return toPaged(await tmdbFetch("/search/movie", movieListSchema, options), toMovieSummary);
        case "tv":
            return toPaged(await tmdbFetch("/search/tv", tvListSchema, options), toTvSummary);
        case "person":
            return toPaged(await tmdbFetch("/search/person", personListSchema, options), toPersonSummary);
    }
};

/* ------------------------------------------------------------------ */
/* Details, with English fallback for untranslated text                */
/* ------------------------------------------------------------------ */

const DETAIL_APPEND = "credits,videos,recommendations,watch/providers";

const detailOptions = (locale: AppLocale, tag: string, extra: Record<string, QueryValue> = {}) => ({
    params: {
        language: language(locale),
        // Videos are rarely localised: include English and language neutral ones too.
        include_video_language: isEnglish(locale) ? "en,null" : `${locale},en,null`,
        ...extra,
    },
    revalidate: REVALIDATE.detail,
    tags: [tag],
});

/**
 * TMDB returns an empty overview when a title has no translation for the requested language.
 * In that case fetch the English version (cached separately) and use its text.
 */
const englishFallback = async <T>(locale: AppLocale, needsFallback: boolean, fetchEnglish: () => Promise<T>): Promise<T | null> => {
    if (isEnglish(locale) || !needsFallback) return null;
    try {
        return await fetchEnglish();
    } catch {
        return null;
    }
};

export const getMovie = async (id: number, locale: AppLocale): Promise<MovieDetail> => {
    const tag = `tmdb:movie:${String(id)}`;
    const m = await tmdbFetch(`/movie/${String(id)}`, movieDetailSchema, detailOptions(locale, tag, { append_to_response: DETAIL_APPEND }));
    const en = await englishFallback(locale, !m.overview || !m.tagline, () =>
        tmdbFetch(`/movie/${String(id)}`, movieDetailSchema, detailOptions("en", tag)),
    );
    return {
        ...toMovieSummary(m),
        mediaType: "movie",
        overview: m.overview || en?.overview || "",
        tagline: m.tagline || en?.tagline || "",
        runtime: m.runtime || null,
        genres: m.genres,
        collection: m.belongs_to_collection ?? null,
        cast: toCast(m.credits.cast),
        crew: toCrew(m.credits.crew),
        videos: toVideos(m.videos),
        recommendations: m.recommendations.results.map(toMovieSummary).slice(0, 12),
        providers: toProviders(m["watch/providers"]),
    };
};

export const getSeries = async (id: number, locale: AppLocale): Promise<SeriesDetail> => {
    const tag = `tmdb:tv:${String(id)}`;
    const t = await tmdbFetch(`/tv/${String(id)}`, tvDetailSchema, detailOptions(locale, tag, { append_to_response: DETAIL_APPEND }));
    const en = await englishFallback(locale, !t.overview, () => tmdbFetch(`/tv/${String(id)}`, tvDetailSchema, detailOptions("en", tag)));
    return {
        ...toTvSummary(t),
        mediaType: "tv",
        overview: t.overview || en?.overview || "",
        tagline: t.tagline || en?.tagline || "",
        episodeRuntime: t.episode_run_time[0] ?? null,
        numberOfSeasons: t.number_of_seasons,
        numberOfEpisodes: t.number_of_episodes,
        seasons: t.seasons.map((s) => ({
            seasonNumber: s.season_number,
            name: s.name,
            episodeCount: s.episode_count,
            airDate: s.air_date,
            posterPath: s.poster_path,
        })),
        genres: t.genres,
        cast: toCast(t.credits.cast),
        crew: toCrew(t.credits.crew, t.created_by),
        videos: toVideos(t.videos),
        recommendations: t.recommendations.results.map(toTvSummary).slice(0, 12),
        providers: toProviders(t["watch/providers"]),
    };
};

export const getSeason = async (seriesId: number, seasonNumber: number, locale: AppLocale): Promise<SeasonDetail> => {
    const path = `/tv/${String(seriesId)}/season/${String(seasonNumber)}`;
    const options = (l: AppLocale) => ({
        params: { language: language(l) },
        revalidate: REVALIDATE.detail,
        tags: [`tmdb:tv:${String(seriesId)}`],
    });
    const s = await tmdbFetch(path, seasonDetailSchema, options(locale));
    const en = await englishFallback(locale, !s.overview || s.episodes.some((e) => !e.overview), () =>
        tmdbFetch(path, seasonDetailSchema, options("en")),
    );
    const englishEpisodes = new Map(en?.episodes.map((e) => [e.id, e]));
    return {
        seriesId,
        seasonNumber: s.season_number,
        name: s.name,
        overview: s.overview || en?.overview || "",
        airDate: s.air_date,
        posterPath: s.poster_path,
        episodes: s.episodes.map((e) => ({
            id: e.id,
            episodeNumber: e.episode_number,
            name: e.name,
            overview: e.overview || englishEpisodes.get(e.id)?.overview || "",
            airDate: e.air_date,
            runtime: e.runtime ?? null,
            stillPath: e.still_path,
            rating: e.vote_average,
        })),
    };
};

export const getPerson = async (id: number, locale: AppLocale): Promise<PersonDetail> => {
    const path = `/person/${String(id)}`;
    const tag = `tmdb:person:${String(id)}`;
    const p = await tmdbFetch(path, personDetailSchema, {
        params: { language: language(locale), append_to_response: "combined_credits" },
        revalidate: REVALIDATE.detail,
        tags: [tag],
    });
    const en = await englishFallback(locale, !p.biography, () =>
        tmdbFetch(path, personDetailSchema, { params: { language: language("en") }, revalidate: REVALIDATE.detail, tags: [tag] }),
    );
    return {
        id: p.id,
        name: p.name,
        biography: p.biography || en?.biography || "",
        birthday: p.birthday,
        deathday: p.deathday,
        placeOfBirth: p.place_of_birth,
        knownForDepartment: p.known_for_department,
        profilePath: p.profile_path,
        filmography: toFilmography(p.combined_credits.cast, p.combined_credits.crew),
    };
};

export const getCollection = async (id: number, locale: AppLocale): Promise<CollectionDetail> => {
    const path = `/collection/${String(id)}`;
    const options = (l: AppLocale) => ({
        params: { language: language(l) },
        revalidate: REVALIDATE.detail,
        tags: [`tmdb:collection:${String(id)}`],
    });
    const c = await tmdbFetch(path, collectionDetailSchema, options(locale));
    const en = await englishFallback(locale, !c.overview, () => tmdbFetch(path, collectionDetailSchema, options("en")));
    return {
        id: c.id,
        name: c.name,
        overview: c.overview || en?.overview || "",
        posterPath: c.poster_path,
        backdropPath: c.backdrop_path,
        // Released parts in order, undated (upcoming) parts last.
        parts: c.parts.map(toMovieSummary).sort((a, b) => (a.releaseDate || "9999").localeCompare(b.releaseDate || "9999")),
    };
};
