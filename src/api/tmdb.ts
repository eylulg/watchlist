import { z } from "zod";

export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** TMDB never serves more than 500 pages for list endpoints. */
export const TMDB_MAX_PAGE = 500;

export type MediaType = "movie" | "tv";

export const MEDIA_LABEL: Record<MediaType, { singular: string; plural: string }> = {
    movie: { singular: "movie", plural: "movies" },
    tv: { singular: "series", plural: "series" },
};

export class TmdbError extends Error {
    readonly status: number | undefined;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "TmdbError";
        this.status = status;
    }
}

/* ------------------------------------------------------------------ */
/* Response schemas                                                    */
/* ------------------------------------------------------------------ */

const nullableString = z
    .string()
    .nullish()
    .transform((value) => value ?? null);

const movieListItemSchema = z.object({
    id: z.number(),
    title: z.string(),
    overview: z.string().default(""),
    poster_path: nullableString,
    backdrop_path: nullableString,
    release_date: z.string().optional().default(""),
    vote_average: z.number().default(0),
    vote_count: z.number().default(0),
    genre_ids: z.array(z.number()).default([]),
});

const tvListItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    overview: z.string().default(""),
    poster_path: nullableString,
    backdrop_path: nullableString,
    first_air_date: z.string().optional().default(""),
    vote_average: z.number().default(0),
    vote_count: z.number().default(0),
    genre_ids: z.array(z.number()).default([]),
});

const pagedSchema = <T extends z.ZodType>(item: T) =>
    z.object({
        page: z.number(),
        results: z.array(item),
        total_pages: z.number(),
        total_results: z.number(),
    });

const genreSchema = z.object({ id: z.number(), name: z.string() });
const genreListSchema = z.object({ genres: z.array(genreSchema) });

const castMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    character: z.string().nullish(),
    profile_path: nullableString,
    order: z.number().optional(),
});

const creditsSchema = z.object({ cast: z.array(castMemberSchema).default([]) }).default({ cast: [] });

const movieDetailSchema = z.object({
    id: z.number(),
    title: z.string(),
    tagline: z.string().nullish(),
    overview: z.string().default(""),
    poster_path: nullableString,
    backdrop_path: nullableString,
    release_date: z.string().optional().default(""),
    vote_average: z.number().default(0),
    vote_count: z.number().default(0),
    runtime: z.number().nullish(),
    genres: z.array(genreSchema).default([]),
    credits: creditsSchema,
});

const tvDetailSchema = z.object({
    id: z.number(),
    name: z.string(),
    tagline: z.string().nullish(),
    overview: z.string().default(""),
    poster_path: nullableString,
    backdrop_path: nullableString,
    first_air_date: z.string().optional().default(""),
    vote_average: z.number().default(0),
    vote_count: z.number().default(0),
    episode_run_time: z.array(z.number()).default([]),
    number_of_seasons: z.number().nullish(),
    genres: z.array(genreSchema).default([]),
    credits: creditsSchema,
});

/* ------------------------------------------------------------------ */
/* Normalised app types                                                */
/* ------------------------------------------------------------------ */

/** A movie or series as shown on a card. Movies and series share one shape inside the app. */
export const titleSummarySchema = z.object({
    id: z.number(),
    mediaType: z.enum(["movie", "tv"]),
    title: z.string(),
    overview: z.string(),
    posterPath: z.string().nullable(),
    releaseDate: z.string(),
    rating: z.number(),
    voteCount: z.number(),
    genreIds: z.array(z.number()),
});
export type TitleSummary = z.infer<typeof titleSummarySchema>;

export interface Genre {
    id: number;
    name: string;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
}

export interface TitleDetail extends Omit<TitleSummary, "genreIds"> {
    tagline: string;
    backdropPath: string | null;
    /** Runtime in minutes: the film length, or the typical episode length for a series. */
    runtime: number | null;
    seasons: number | null;
    genres: Genre[];
    cast: CastMember[];
}

export interface Paged<T> {
    page: number;
    results: T[];
    totalPages: number;
    totalResults: number;
}

const toMovieSummary = (m: z.infer<typeof movieListItemSchema>): TitleSummary => ({
    id: m.id,
    mediaType: "movie",
    title: m.title,
    overview: m.overview,
    posterPath: m.poster_path,
    releaseDate: m.release_date,
    rating: m.vote_average,
    voteCount: m.vote_count,
    genreIds: m.genre_ids,
});

const toTvSummary = (t: z.infer<typeof tvListItemSchema>): TitleSummary => ({
    id: t.id,
    mediaType: "tv",
    title: t.name,
    overview: t.overview,
    posterPath: t.poster_path,
    releaseDate: t.first_air_date,
    rating: t.vote_average,
    voteCount: t.vote_count,
    genreIds: t.genre_ids,
});

const toCast = (cast: z.infer<typeof castMemberSchema>[]): CastMember[] =>
    [...cast]
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 6)
        .map((c) => ({ id: c.id, name: c.name, character: c.character ?? "", profilePath: c.profile_path }));

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

type QueryValue = string | number | boolean | undefined | null;

const getCredential = (): string => {
    const key = (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim();
    if (!key) {
        throw new TmdbError("The TMDB API key is missing. Set VITE_TMDB_API_KEY in your .env file.");
    }
    return key;
};

/** v4 read access tokens are JWTs, v3 API keys are 32 hex characters. */
const isV4Token = (credential: string) => credential.startsWith("eyJ");

export const buildUrl = (path: string, params: Record<string, QueryValue> = {}, credential = getCredential()): URL => {
    const url = new URL(`${TMDB_API_BASE}${path}`);
    for (const [name, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
    }
    if (!isV4Token(credential)) url.searchParams.set("api_key", credential);
    return url;
};

const tmdbFetch = async <T extends z.ZodType>(
    path: string,
    schema: T,
    params: Record<string, QueryValue> = {},
    signal?: AbortSignal,
): Promise<z.infer<T>> => {
    const credential = getCredential();
    const headers: HeadersInit = { Accept: "application/json" };
    if (isV4Token(credential)) headers.Authorization = `Bearer ${credential}`;

    let response: Response;
    try {
        response = await fetch(buildUrl(path, { language: "en-US", ...params }, credential), { headers, signal });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
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

const toPaged = <I, O>(
    data: { page: number; results: I[]; total_pages: number; total_results: number },
    map: (item: I) => O,
): Paged<O> => ({
    page: data.page,
    results: data.results.map(map),
    totalPages: Math.min(data.total_pages, TMDB_MAX_PAGE),
    totalResults: data.total_results,
});

const movieListSchema = pagedSchema(movieListItemSchema);
const tvListSchema = pagedSchema(tvListItemSchema);

const fetchList = async (mediaType: MediaType, path: string, params: Record<string, QueryValue>, signal?: AbortSignal) =>
    mediaType === "movie"
        ? toPaged(await tmdbFetch(path, movieListSchema, params, signal), toMovieSummary)
        : toPaged(await tmdbFetch(path, tvListSchema, params, signal), toTvSummary);

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export type TimeWindow = "day" | "week";

export const getTrending = (mediaType: MediaType, timeWindow: TimeWindow = "week", signal?: AbortSignal) =>
    fetchList(mediaType, `/trending/${mediaType}/${timeWindow}`, {}, signal);

export type SortOption = "rating" | "release" | "title";

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: "rating", label: "Highest rated" },
    { id: "release", label: "Newest first" },
    { id: "title", label: "Title A to Z" },
];

export interface BrowseParams {
    mediaType: MediaType;
    page: number;
    sort: SortOption;
    genreId?: number | undefined;
    year?: number | undefined;
}

const discoverSort: Record<MediaType, Record<SortOption, string>> = {
    movie: { rating: "vote_average.desc", release: "primary_release_date.desc", title: "title.asc" },
    tv: { rating: "vote_average.desc", release: "first_air_date.desc", title: "name.asc" },
};

const today = () => new Date().toISOString().slice(0, 10);

/** Browse with server side sorting and filtering through /discover. */
export const discoverTitles = ({ mediaType, page, sort, genreId, year }: BrowseParams, signal?: AbortSignal) => {
    const isMovie = mediaType === "movie";
    return fetchList(
        mediaType,
        `/discover/${mediaType}`,
        {
            page,
            sort_by: discoverSort[mediaType][sort],
            include_adult: false,
            // Keep the catalogue meaningful: skip unreleased and barely voted titles.
            "vote_count.gte": sort === "rating" ? (isMovie ? 1000 : 300) : 50,
            [isMovie ? "primary_release_date.lte" : "first_air_date.lte"]: today(),
            [isMovie ? "primary_release_year" : "first_air_date_year"]: year,
            with_genres: genreId,
        },
        signal,
    );
};

/** Free text search. TMDB search supports a year filter but no sorting or genre filter. */
export const searchTitles = (
    { mediaType, query, page, year }: { mediaType: MediaType; query: string; page: number; year?: number | undefined },
    signal?: AbortSignal,
) =>
    fetchList(
        mediaType,
        `/search/${mediaType}`,
        {
            query,
            page,
            include_adult: false,
            [mediaType === "movie" ? "primary_release_year" : "first_air_date_year"]: year,
        },
        signal,
    );

export const getGenres = async (mediaType: MediaType, signal?: AbortSignal): Promise<Genre[]> =>
    (await tmdbFetch(`/genre/${mediaType}/list`, genreListSchema, {}, signal)).genres;

export const getTitleDetail = async (mediaType: MediaType, id: number, signal?: AbortSignal): Promise<TitleDetail> => {
    const params = { append_to_response: "credits" };
    if (mediaType === "movie") {
        const m = await tmdbFetch(`/movie/${id}`, movieDetailSchema, params, signal);
        return {
            id: m.id,
            mediaType,
            title: m.title,
            tagline: m.tagline ?? "",
            overview: m.overview,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            releaseDate: m.release_date,
            rating: m.vote_average,
            voteCount: m.vote_count,
            runtime: m.runtime || null,
            seasons: null,
            genres: m.genres,
            cast: toCast(m.credits.cast),
        };
    }
    const t = await tmdbFetch(`/tv/${id}`, tvDetailSchema, params, signal);
    return {
        id: t.id,
        mediaType,
        title: t.name,
        tagline: t.tagline ?? "",
        overview: t.overview,
        posterPath: t.poster_path,
        backdropPath: t.backdrop_path,
        releaseDate: t.first_air_date,
        rating: t.vote_average,
        voteCount: t.vote_count,
        runtime: t.episode_run_time[0] ?? null,
        seasons: t.number_of_seasons ?? null,
        genres: t.genres,
        cast: toCast(t.credits.cast),
    };
};

/* ------------------------------------------------------------------ */
/* Client side helpers for search results                              */
/* ------------------------------------------------------------------ */

/** Sorts one page of results locally. Used for search, where TMDB has no sort parameter. */
export const sortTitles = (titles: TitleSummary[], sort: SortOption): TitleSummary[] => {
    const copy = [...titles];
    switch (sort) {
        case "rating":
            return copy.sort((a, b) => b.rating - a.rating || b.voteCount - a.voteCount);
        case "release":
            return copy.sort((a, b) => (b.releaseDate || "0").localeCompare(a.releaseDate || "0"));
        case "title":
            return copy.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
    }
};

export const releaseYear = (date: string): string => (/^\d{4}/.test(date) ? date.slice(0, 4) : "");
