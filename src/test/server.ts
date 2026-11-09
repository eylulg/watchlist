import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { TMDB_API_BASE } from "@/api/tmdb";
import { movie, movieDetail, movieGenres, paged, series, tvGenres } from "./fixtures";

export const api = (path: string) => `${TMDB_API_BASE}${path}`;

/** Every request the app made to TMDB during a test, for asserting on parameters. */
export const requests: URL[] = [];

export const handlers = [
    http.get(api("/trending/movie/:window"), () => HttpResponse.json(paged([movie(1), movie(2), movie(3)]))),
    http.get(api("/trending/tv/:window"), () => HttpResponse.json(paged([series(11), series(12)]))),
    http.get(api("/genre/movie/list"), () => HttpResponse.json(movieGenres)),
    http.get(api("/genre/tv/list"), () => HttpResponse.json(tvGenres)),
    http.get(api("/discover/movie"), () =>
        HttpResponse.json(paged([movie(1), movie(2, { title: "Arrival" }), movie(3)], { total_pages: 3, total_results: 60 })),
    ),
    http.get(api("/discover/tv"), () => HttpResponse.json(paged([series(11), series(12)], { total_pages: 1, total_results: 2 }))),
    http.get(api("/search/movie"), ({ request }) => {
        const q = new URL(request.url).searchParams.get("query") ?? "";
        return HttpResponse.json(paged([movie(50, { title: `${q} part one` }), movie(51, { title: `${q} part two` })]));
    }),
    http.get(api("/search/tv"), () => HttpResponse.json(paged([]))),
    http.get(api("/movie/:id"), ({ params }) => HttpResponse.json(movieDetail(Number(params.id)))),
];

export const server = setupServer(...handlers);

server.events.on("request:start", ({ request }) => {
    requests.push(new URL(request.url));
});

export const requestsTo = (path: string) => requests.filter((url) => url.pathname === new URL(api(path)).pathname);
