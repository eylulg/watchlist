import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest } from 'next/server';
import { GET as searchRoute } from '@/app/api/search/route';
import { GET as titlesRoute } from '@/app/api/titles/route';
import { DEFAULT_TMDB_API_BASE } from '@/lib/tmdb/client';
import {
  collectionDetail,
  movie,
  movieDetail,
  paged,
  person,
  personDetail,
  seasonDetail,
  series,
  tvDetail,
} from './fixtures';

export const api = (path: string) => `${DEFAULT_TMDB_API_BASE}${path}`;

/** Every request made to TMDB (or the app's own API) during a test, for asserting on parameters. */
export const requests: URL[] = [];

const handlers = [
  http.get(api('/trending/all/:window'), () =>
    HttpResponse.json(
      paged([
        { ...movie(1), media_type: 'movie' },
        { ...series(11), media_type: 'tv' },
        { ...person(5), media_type: 'person' },
      ]),
    ),
  ),
  http.get(api('/movie/popular'), () => HttpResponse.json(paged([movie(1), movie(2)]))),
  http.get(api('/movie/top_rated'), () => HttpResponse.json(paged([movie(3)]))),
  http.get(api('/tv/popular'), () => HttpResponse.json(paged([series(11)]))),
  http.get(api('/tv/top_rated'), () => HttpResponse.json(paged([series(12)]))),
  http.get(api('/search/multi'), ({ request }) => {
    const q = new URL(request.url).searchParams.get('query') ?? '';
    return HttpResponse.json(
      paged(
        [
          { ...movie(50, { title: `${q} part one` }), media_type: 'movie' },
          { ...series(51, { name: `${q} the series` }), media_type: 'tv' },
          { ...person(52), media_type: 'person' },
        ],
        {
          total_pages: 3,
          total_results: 55,
        },
      ),
    );
  }),
  http.get(api('/search/movie'), ({ request }) => {
    const q = new URL(request.url).searchParams.get('query') ?? '';
    return HttpResponse.json(
      paged([movie(50, { title: `${q} part one` }), movie(51, { title: `${q} part two` })]),
    );
  }),
  http.get(api('/search/tv'), () => HttpResponse.json(paged([]))),
  http.get(api('/search/person'), () => HttpResponse.json(paged([person(52)]))),
  http.get(api('/movie/:id'), ({ params }) => HttpResponse.json(movieDetail(Number(params.id)))),
  http.get(api('/tv/:id/season/:season'), ({ params }) =>
    HttpResponse.json(seasonDetail(Number(params.season))),
  ),
  http.get(api('/tv/:id'), ({ params }) => HttpResponse.json(tvDetail(Number(params.id)))),
  http.get(api('/person/:id'), ({ params }) => HttpResponse.json(personDetail(Number(params.id)))),
  http.get(api('/collection/:id'), ({ params }) =>
    HttpResponse.json(collectionDetail(Number(params.id))),
  ),

  // The browser side of search calls the app's own route handler, which then calls TMDB above.
  http.get('*/api/search', async ({ request }) =>
    searchRoute(new NextRequest(request.url, { headers: request.headers })),
  ),
  // A shared link carries only ids; the shared page resolves them through this route.
  http.get('*/api/titles', async ({ request }) =>
    titlesRoute(new NextRequest(request.url, { headers: request.headers })),
  ),
];

export const server = setupServer(...handlers);

server.events.on('request:start', ({ request }) => {
  requests.push(new URL(request.url));
});

export const requestsTo = (path: string) =>
  requests.filter((url) => url.pathname === new URL(api(path)).pathname || url.pathname === path);
