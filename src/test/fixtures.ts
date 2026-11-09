/** Raw TMDB shaped fixtures, as the API returns them. */

export const movie = (id: number, overrides: Record<string, unknown> = {}) => ({
    id,
    title: `Movie ${String(id)}`,
    overview: `Overview of movie ${String(id)}`,
    poster_path: `/poster-${String(id)}.jpg`,
    backdrop_path: null,
    release_date: "2021-05-01",
    vote_average: 7.5,
    vote_count: 1200,
    genre_ids: [18],
    adult: false,
    original_language: "en",
    popularity: 10,
    ...overrides,
});

export const series = (id: number, overrides: Record<string, unknown> = {}) => ({
    id,
    name: `Series ${String(id)}`,
    overview: `Overview of series ${String(id)}`,
    poster_path: `/series-${String(id)}.jpg`,
    backdrop_path: null,
    first_air_date: "2019-01-10",
    vote_average: 8.1,
    vote_count: 900,
    genre_ids: [18],
    ...overrides,
});

export const paged = <T>(results: T[], { page = 1, total_pages = 1, total_results = results.length } = {}) => ({
    page,
    results,
    total_pages,
    total_results,
});

export const movieGenres = {
    genres: [
        { id: 18, name: "Drama" },
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
    ],
};

export const tvGenres = {
    genres: [
        { id: 18, name: "Drama" },
        { id: 10765, name: "Sci-Fi & Fantasy" },
    ],
};

export const movieDetail = (id: number, overrides: Record<string, unknown> = {}) => ({
    ...movie(id),
    tagline: "A tagline",
    runtime: 155,
    genres: [
        { id: 878, name: "Science Fiction" },
        { id: 12, name: "Adventure" },
    ],
    credits: {
        cast: Array.from({ length: 8 }, (_, i) => ({
            id: 100 + i,
            name: `Actor ${String(i + 1)}`,
            character: `Character ${String(i + 1)}`,
            profile_path: i === 1 ? null : `/actor-${String(i + 1)}.jpg`,
            // Deliberately out of order: the app must sort by billing order.
            order: 7 - i,
        })),
    },
    ...overrides,
});
