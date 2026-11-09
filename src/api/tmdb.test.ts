import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { movie, movieDetail, paged, series } from "@/test/fixtures";
import { api, requestsTo, server } from "@/test/server";
import { TmdbError, buildUrl, discoverTitles, getTitleDetail, getTrending, searchTitles, sortTitles } from "./tmdb";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("TMDB API layer", () => {
    it("normalises a movie list and sends the v3 key as a query parameter", async () => {
        const result = await discoverTitles({ mediaType: "movie", page: 2, sort: "title", genreId: 28, year: 2015 });

        expect(result.totalPages).toBe(3);
        expect(result.results[0]).toEqual({
            id: 1,
            mediaType: "movie",
            title: "Movie 1",
            overview: "Overview of movie 1",
            posterPath: "/poster-1.jpg",
            releaseDate: "2021-05-01",
            rating: 7.5,
            voteCount: 1200,
            genreIds: [18],
        });

        const [url] = requestsTo("/discover/movie");
        expect(url.searchParams.get("api_key")).toBe("test-key");
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("sort_by")).toBe("title.asc");
        expect(url.searchParams.get("with_genres")).toBe("28");
        expect(url.searchParams.get("primary_release_year")).toBe("2015");
    });

    it("maps series fields (name, first_air_date) to the shared shape", async () => {
        const result = await getTrending("tv", "day");
        expect(result.results[0]).toMatchObject({ id: 11, mediaType: "tv", title: "Series 11", releaseDate: "2019-01-10" });
    });

    it("tolerates missing optional fields and null posters", async () => {
        server.use(
            http.get(api("/search/movie"), () =>
                HttpResponse.json(paged([{ id: 9, title: "Sparse", poster_path: null }, movie(10, { release_date: undefined })])),
            ),
        );
        const result = await searchTitles({ mediaType: "movie", query: "sparse", page: 1 });
        expect(result.results[0]).toMatchObject({ id: 9, posterPath: null, overview: "", releaseDate: "", rating: 0, genreIds: [] });
        expect(result.results[1]?.releaseDate).toBe("");
    });

    it("caps total pages at TMDB's 500 page limit", async () => {
        server.use(http.get(api("/discover/tv"), () => HttpResponse.json(paged([series(1)], { total_pages: 9000 }))));
        const result = await discoverTitles({ mediaType: "tv", page: 1, sort: "rating" });
        expect(result.totalPages).toBe(500);
    });

    it("rejects responses that do not match the schema", async () => {
        server.use(http.get(api("/trending/movie/week"), () => HttpResponse.json({ results: "nope" })));
        await expect(getTrending("movie")).rejects.toThrow("TMDB returned data in an unexpected format.");
    });

    it("surfaces TMDB error messages with the HTTP status", async () => {
        server.use(
            http.get(api("/trending/movie/week"), () =>
                HttpResponse.json({ status_code: 7, status_message: "Invalid API key: You must be granted a valid key." }, { status: 401 }),
            ),
        );
        const error = await getTrending("movie").catch((e: unknown) => e);
        expect(error).toBeInstanceOf(TmdbError);
        expect(error).toMatchObject({ status: 401, message: "Invalid API key: You must be granted a valid key." });
    });

    it("reports network failures as a TmdbError", async () => {
        server.use(http.get(api("/trending/movie/week"), () => HttpResponse.error()));
        await expect(getTrending("movie")).rejects.toThrow("Could not reach TMDB");
    });

    it("explains a missing key instead of calling TMDB", async () => {
        vi.stubEnv("VITE_TMDB_API_KEY", "");
        await expect(getTrending("movie")).rejects.toThrow("VITE_TMDB_API_KEY");
        expect(requestsTo("/trending/movie/week")).toHaveLength(0);
    });

    it("sends a v4 read token as a Bearer header instead of a query parameter", async () => {
        vi.stubEnv("VITE_TMDB_API_KEY", "eyJhbGciOiJIUzI1NiJ9.test.token");
        let authorization: string | null = null;
        server.use(
            http.get(api("/trending/movie/week"), ({ request }) => {
                authorization = request.headers.get("authorization");
                return HttpResponse.json(paged([movie(1)]));
            }),
        );
        await getTrending("movie");
        expect(authorization).toBe("Bearer eyJhbGciOiJIUzI1NiJ9.test.token");
        expect(requestsTo("/trending/movie/week")[0]?.searchParams.has("api_key")).toBe(false);
        expect(buildUrl("/x", {}, "eyJabc").searchParams.has("api_key")).toBe(false);
    });

    it("parses details with the top 6 cast in billing order", async () => {
        const detail = await getTitleDetail("movie", 42);
        expect(detail).toMatchObject({ id: 42, title: "Movie 42", runtime: 155, seasons: null, tagline: "A tagline" });
        expect(detail.genres.map((g) => g.name)).toEqual(["Science Fiction", "Adventure"]);
        expect(detail.cast).toHaveLength(6);
        expect(detail.cast.map((c) => c.name)).toEqual(["Actor 8", "Actor 7", "Actor 6", "Actor 5", "Actor 4", "Actor 3"]);
        expect(requestsTo("/movie/42")[0]?.searchParams.get("append_to_response")).toBe("credits");
    });

    it("uses the episode length and season count for series details", async () => {
        server.use(
            http.get(api("/tv/7"), () =>
                HttpResponse.json({
                    ...series(7),
                    episode_run_time: [],
                    number_of_seasons: 3,
                    genres: [],
                    credits: { cast: [] },
                }),
            ),
        );
        const detail = await getTitleDetail("tv", 7);
        expect(detail).toMatchObject({ title: "Series 7", runtime: null, seasons: 3, cast: [] });
    });

    it("treats a zero runtime as unknown", async () => {
        server.use(http.get(api("/movie/5"), () => HttpResponse.json(movieDetail(5, { runtime: 0 }))));
        expect((await getTitleDetail("movie", 5)).runtime).toBeNull();
    });
});

describe("sortTitles", () => {
    const titles = [
        {
            id: 1,
            mediaType: "movie" as const,
            title: "beta",
            overview: "",
            posterPath: null,
            releaseDate: "2001-01-01",
            rating: 6,
            voteCount: 1,
            genreIds: [],
        },
        {
            id: 2,
            mediaType: "movie" as const,
            title: "Alpha",
            overview: "",
            posterPath: null,
            releaseDate: "2020-01-01",
            rating: 9,
            voteCount: 1,
            genreIds: [],
        },
        {
            id: 3,
            mediaType: "movie" as const,
            title: "Gamma",
            overview: "",
            posterPath: null,
            releaseDate: "",
            rating: 7,
            voteCount: 1,
            genreIds: [],
        },
    ];

    it("sorts by rating, newest release and title without mutating the input", () => {
        expect(sortTitles(titles, "rating").map((t) => t.id)).toEqual([2, 3, 1]);
        expect(sortTitles(titles, "release").map((t) => t.id)).toEqual([2, 1, 3]);
        expect(sortTitles(titles, "title").map((t) => t.title)).toEqual(["Alpha", "beta", "Gamma"]);
        expect(titles.map((t) => t.id)).toEqual([1, 2, 3]);
    });
});
