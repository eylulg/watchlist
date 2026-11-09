/**
 * A tiny TMDB stand-in for the end to end suite. The Next server is started with
 * TMDB_API_BASE_URL pointing here, so server components and route handlers run their real code
 * against canned data. Posters and logos are null so no image is fetched from the internet.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_TMDB_PORT ?? 4010);

const movie = (id: number, title: string, extra: Record<string, unknown> = {}) => ({
    id,
    title,
    overview: `${title} overview.`,
    poster_path: null,
    backdrop_path: null,
    release_date: "2021-09-15",
    vote_average: 7.8,
    vote_count: 12000,
    ...extra,
});

const series = (id: number, name: string) => ({
    id,
    name,
    overview: `${name} overview.`,
    poster_path: null,
    backdrop_path: null,
    first_air_date: "2022-02-18",
    vote_average: 8.4,
    vote_count: 3000,
});

const paged = (results: unknown[], totalPages = 1) => ({ page: 1, results, total_pages: totalPages, total_results: results.length });

const MOVIES = [movie(1, "Dune"), movie(2, "Arrival"), movie(3, "Blade Runner 2049")];
const SERIES = [series(11, "Severance"), series(12, "Shogun")];

const credits = {
    cast: [{ id: 52, name: "Timothée Chalamet", character: "Paul Atreides", profile_path: null, order: 0 }],
    crew: [{ id: 60, name: "Denis Villeneuve", job: "Director", department: "Directing", profile_path: null }],
};

const providers = {
    results: {
        US: {
            link: "https://www.themoviedb.org/movie/1/watch?locale=US",
            flatrate: [{ provider_id: 8, provider_name: "Example Stream", logo_path: null, display_priority: 1 }],
        },
    },
};

const routes: [RegExp, (match: RegExpMatchArray, url: URL) => unknown][] = [
    [
        /^\/3\/trending\/all\/\w+$/,
        () => paged([...MOVIES.map((m) => ({ ...m, media_type: "movie" })), ...SERIES.map((s) => ({ ...s, media_type: "tv" }))]),
    ],
    [/^\/3\/movie\/(popular|top_rated)$/, () => paged(MOVIES)],
    [/^\/3\/tv\/(popular|top_rated)$/, () => paged(SERIES)],
    [
        /^\/3\/search\/(multi|movie|tv|person)$/,
        (match, url) => {
            const query = (url.searchParams.get("query") ?? "").toLowerCase();
            const titles = [
                ...MOVIES.map((m) => ({ ...m, media_type: "movie" })),
                ...SERIES.map((s) => ({ ...s, media_type: "tv" })),
            ].filter((t) => ("title" in t ? t.title : t.name).toLowerCase().includes(query));
            if (match[1] === "person") return paged([]);
            return paged(match[1] === "multi" ? titles : titles.filter((t) => t.media_type === match[1]));
        },
    ],
    [
        /^\/3\/movie\/(\d+)$/,
        (match) => {
            const found = MOVIES.find((m) => m.id === Number(match[1]));
            if (!found) return null;
            return {
                ...found,
                tagline: "Fear is the mind-killer.",
                runtime: 155,
                genres: [{ id: 878, name: "Science Fiction" }],
                belongs_to_collection: { id: 900, name: "Dune Collection" },
                credits,
                videos: { results: [{ key: "trailer1", name: "Official trailer", site: "YouTube", type: "Trailer", official: true }] },
                recommendations: paged(MOVIES.filter((m) => m.id !== found.id)),
                "watch/providers": providers,
            };
        },
    ],
    [
        /^\/3\/tv\/(\d+)\/season\/(\d+)$/,
        (match) => ({
            season_number: Number(match[2]),
            name: `Season ${match[2] ?? ""}`,
            overview: "",
            air_date: "2022-02-18",
            poster_path: null,
            episodes: [
                {
                    id: 501,
                    episode_number: 1,
                    name: "Good News About Hell",
                    overview: "Mark is promoted.",
                    air_date: "2022-02-18",
                    runtime: 57,
                    still_path: null,
                    vote_average: 8,
                },
            ],
        }),
    ],
    [
        /^\/3\/tv\/(\d+)$/,
        (match) => {
            const found = SERIES.find((s) => s.id === Number(match[1]));
            if (!found) return null;
            return {
                ...found,
                tagline: "",
                episode_run_time: [50],
                number_of_seasons: 1,
                number_of_episodes: 9,
                genres: [{ id: 18, name: "Drama" }],
                created_by: [{ id: 70, name: "Dan Erickson", profile_path: null }],
                seasons: [{ season_number: 1, name: "Season 1", episode_count: 9, air_date: "2022-02-18", poster_path: null }],
                credits,
                videos: { results: [] },
                recommendations: paged([]),
                "watch/providers": { results: {} },
            };
        },
    ],
    [
        /^\/3\/person\/(\d+)$/,
        (match) => ({
            id: Number(match[1]),
            name: "Timothée Chalamet",
            biography: "An actor.",
            birthday: "1995-12-27",
            deathday: null,
            place_of_birth: "New York City, USA",
            known_for_department: "Acting",
            profile_path: null,
            combined_credits: {
                cast: [
                    {
                        id: 1,
                        media_type: "movie",
                        title: "Dune",
                        release_date: "2021-09-15",
                        character: "Paul Atreides",
                        poster_path: null,
                    },
                    { id: 4, media_type: "movie", title: "Lady Bird", release_date: "2017-11-03", character: "Kyle", poster_path: null },
                ],
                crew: [],
            },
        }),
    ],
    [
        /^\/3\/collection\/(\d+)$/,
        (match) => ({
            id: Number(match[1]),
            name: "Dune Collection",
            overview: "The Dune films.",
            poster_path: null,
            backdrop_path: null,
            parts: [MOVIES[0]],
        }),
    ],
];

createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://localhost:${String(PORT)}`);
    const route = routes.find(([pattern]) => pattern.test(url.pathname));
    const match = route ? url.pathname.match(route[0]) : null;
    const body = route && match ? route[1](match, url) : null;
    response.writeHead(body ? 200 : 404, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body ?? { status_code: 34, status_message: "The resource you requested could not be found." }));
}).listen(PORT, "127.0.0.1", () => {
    console.log(`Mock TMDB listening on http://127.0.0.1:${String(PORT)}/3`);
});
