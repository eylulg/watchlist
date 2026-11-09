import { z } from "zod";

/** Raw TMDB response schemas. Fields the app does not use are ignored; optional ones get safe defaults. */

const nullableString = z
    .string()
    .nullish()
    .transform((value) => value ?? null);

const text = z
    .string()
    .nullish()
    .transform((value) => value ?? "");

const number = z
    .number()
    .nullish()
    .transform((value) => value ?? 0);

export const movieListItemSchema = z.object({
    id: z.number(),
    title: z.string(),
    overview: text,
    poster_path: nullableString,
    backdrop_path: nullableString,
    release_date: text,
    vote_average: number,
    vote_count: number,
});

export const tvListItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    overview: text,
    poster_path: nullableString,
    backdrop_path: nullableString,
    first_air_date: text,
    vote_average: number,
    vote_count: number,
});

export const personListItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    profile_path: nullableString,
    known_for_department: text,
    known_for: z
        .array(z.object({ title: z.string().optional(), name: z.string().optional() }).loose())
        .nullish()
        .transform((value) => value ?? []),
});

/** `/trending/all` and `/search/multi` mix media types in one list. Unknown types are dropped. */
export const multiItemSchema = z.discriminatedUnion("media_type", [
    movieListItemSchema.extend({ media_type: z.literal("movie") }),
    tvListItemSchema.extend({ media_type: z.literal("tv") }),
    personListItemSchema.extend({ media_type: z.literal("person") }),
]);

/** Keeps items that parse and silently drops the rest, so one odd result never breaks a whole page. */
const lenientArray = <T extends z.ZodType>(item: T) =>
    z.array(z.unknown()).transform((items) =>
        items.flatMap((raw) => {
            const parsed = item.safeParse(raw);
            return parsed.success ? [parsed.data] : [];
        }),
    );

export const pagedSchema = <T extends z.ZodType>(item: T) =>
    z.object({
        page: z.number(),
        results: lenientArray(item),
        total_pages: z.number(),
        total_results: z.number(),
    });

const genreSchema = z.object({ id: z.number(), name: z.string() });

const castMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    character: text,
    profile_path: nullableString,
    order: z.number().optional(),
});

const crewMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    job: z.string(),
    department: text,
    profile_path: nullableString,
});

const creditsSchema = z
    .object({
        cast: z.array(castMemberSchema).default([]),
        crew: z.array(crewMemberSchema).default([]),
    })
    .default({ cast: [], crew: [] });

const videoSchema = z.object({
    key: z.string(),
    name: z.string(),
    site: z.string(),
    type: z.string(),
    official: z.boolean().optional(),
    published_at: z.string().optional(),
});

const videosSchema = z.object({ results: z.array(videoSchema).default([]) }).default({ results: [] });

const providerSchema = z.object({
    provider_id: z.number(),
    provider_name: z.string(),
    logo_path: nullableString,
    display_priority: z.number().optional(),
});

const providerList = z
    .array(providerSchema)
    .optional()
    .transform((value) => value ?? []);

const regionProvidersSchema = z.object({
    link: nullableString,
    flatrate: providerList,
    free: providerList,
    ads: providerList,
    rent: providerList,
    buy: providerList,
});

const watchProvidersSchema = z.object({ results: z.record(z.string(), regionProvidersSchema).default({}) }).default({ results: {} });

const recommendationsSchema = <T extends z.ZodType>(item: T) =>
    z.object({ results: lenientArray(item) }).default({ results: [] as z.infer<T>[] });

export const movieDetailSchema = movieListItemSchema.extend({
    tagline: text,
    runtime: z.number().nullish(),
    genres: z.array(genreSchema).default([]),
    belongs_to_collection: z.object({ id: z.number(), name: z.string() }).nullish(),
    credits: creditsSchema,
    videos: videosSchema,
    recommendations: recommendationsSchema(movieListItemSchema),
    "watch/providers": watchProvidersSchema,
});

export const tvDetailSchema = tvListItemSchema.extend({
    tagline: text,
    episode_run_time: z.array(z.number()).default([]),
    number_of_seasons: number,
    number_of_episodes: number,
    genres: z.array(genreSchema).default([]),
    created_by: z.array(z.object({ id: z.number(), name: z.string(), profile_path: nullableString })).default([]),
    seasons: z
        .array(
            z.object({
                season_number: z.number(),
                name: z.string(),
                episode_count: number,
                air_date: text,
                poster_path: nullableString,
            }),
        )
        .default([]),
    credits: creditsSchema,
    videos: videosSchema,
    recommendations: recommendationsSchema(tvListItemSchema),
    "watch/providers": watchProvidersSchema,
});

export const seasonDetailSchema = z.object({
    season_number: z.number(),
    name: z.string(),
    overview: text,
    air_date: text,
    poster_path: nullableString,
    episodes: z
        .array(
            z.object({
                id: z.number(),
                episode_number: z.number(),
                name: text,
                overview: text,
                air_date: text,
                runtime: z.number().nullish(),
                still_path: nullableString,
                vote_average: number,
            }),
        )
        .default([]),
});

const combinedCreditSchema = z.object({
    id: z.number(),
    media_type: z.enum(["movie", "tv"]),
    title: z.string().optional(),
    name: z.string().optional(),
    poster_path: nullableString,
    release_date: z.string().optional(),
    first_air_date: z.string().optional(),
    character: z.string().nullish(),
    job: z.string().nullish(),
});

export const personDetailSchema = z.object({
    id: z.number(),
    name: z.string(),
    biography: text,
    birthday: text,
    deathday: text,
    place_of_birth: text,
    known_for_department: text,
    profile_path: nullableString,
    combined_credits: z
        .object({ cast: lenientArray(combinedCreditSchema), crew: lenientArray(combinedCreditSchema) })
        .default({ cast: [], crew: [] }),
});

export const collectionDetailSchema = z.object({
    id: z.number(),
    name: z.string(),
    overview: text,
    poster_path: nullableString,
    backdrop_path: nullableString,
    parts: lenientArray(movieListItemSchema),
});

export type RawMovieListItem = z.infer<typeof movieListItemSchema>;
export type RawTvListItem = z.infer<typeof tvListItemSchema>;
export type RawPersonListItem = z.infer<typeof personListItemSchema>;
export type RawCredits = z.infer<typeof creditsSchema>;
export type RawVideos = z.infer<typeof videosSchema>;
export type RawWatchProviders = z.infer<typeof watchProvidersSchema>;
export type RawCombinedCredit = z.infer<typeof combinedCreditSchema>;
