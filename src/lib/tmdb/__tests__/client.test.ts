import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { movie, movieDetail, paged, series, tvDetail } from '@/test-utils/fixtures';
import { api, requestsTo, server } from '@/test-utils/server';
import {
  TmdbError,
  getCollection,
  getList,
  getMovie,
  getPerson,
  getSeason,
  getSeries,
  getTrending,
  search,
} from '../client';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('transport', () => {
  it("sends a v3 key as the api_key query parameter, with the locale's language", async () => {
    await getList('movie', 'popular', 'de', 2);

    const [url] = requestsTo('/movie/popular');
    expect(url?.searchParams.get('api_key')).toBe('test-key');
    expect(url?.searchParams.get('language')).toBe('de-DE');
    expect(url?.searchParams.get('page')).toBe('2');
  });

  it('sends a v4 read token as a Bearer header instead of a query parameter', async () => {
    vi.stubEnv('TMDB_API_KEY', 'eyJhbGciOiJIUzI1NiJ9.test.token');
    let authorization: string | null = null;
    server.use(
      http.get(api('/movie/popular'), ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json(paged([movie(1)]));
      }),
    );

    await getList('movie', 'popular', 'en');

    expect(authorization).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.test.token');
    expect(requestsTo('/movie/popular')[0]?.searchParams.has('api_key')).toBe(false);
  });

  it('explains a missing key instead of calling TMDB', async () => {
    vi.stubEnv('TMDB_API_KEY', '');

    await expect(getTrending('en')).rejects.toThrow('TMDB_API_KEY');
    expect(requestsTo('/trending/all/week')).toHaveLength(0);
  });

  it.each([
    [
      'a TMDB error message with its status',
      () => HttpResponse.json({ status_message: 'Invalid API key.' }, { status: 401 }),
      { status: 401, message: 'Invalid API key.' },
    ],
    [
      'a generic message for a non JSON error body',
      () => new HttpResponse('Bad gateway', { status: 502 }),
      { status: 502, message: 'TMDB request failed with status 502.' },
    ],
    [
      'a network failure',
      () => HttpResponse.error(),
      { status: undefined, message: 'Could not reach TMDB. Check your connection and try again.' },
    ],
    [
      'a response that does not match the schema',
      () => HttpResponse.json({ results: 'nope' }),
      { status: undefined, message: 'TMDB returned data in an unexpected format.' },
    ],
  ])('reports %s as a TmdbError', async (_, respond, expected) => {
    server.use(http.get(api('/movie/popular'), respond));

    const error = await getList('movie', 'popular', 'en').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect(error).toMatchObject(expected);
  });
});

describe('lists and search', () => {
  it('normalises movies and series to one shape and drops people from trending', async () => {
    const result = await getTrending('en');

    expect(result.results).toEqual([
      expect.objectContaining({
        id: 1,
        mediaType: 'movie',
        title: 'Movie 1',
        releaseDate: '2021-05-01',
        posterPath: '/poster-1.jpg',
      }),
      expect.objectContaining({
        id: 11,
        mediaType: 'tv',
        title: 'Series 11',
        releaseDate: '2019-01-10',
      }),
    ]);
  });

  it('fills defaults for missing fields and skips items that cannot be parsed', async () => {
    server.use(
      http.get(api('/movie/popular'), () =>
        HttpResponse.json(
          paged([{ id: 9, title: 'Sparse', poster_path: null }, { id: 'broken' }, movie(10)]),
        ),
      ),
    );

    const result = await getList('movie', 'popular', 'en');

    expect(result.results.map((r) => r.id)).toEqual([9, 10]);
    expect(result.results[0]).toMatchObject({
      posterPath: null,
      overview: '',
      releaseDate: '',
      rating: 0,
    });
  });

  it("caps total pages at TMDB's 500 page limit", async () => {
    server.use(
      http.get(api('/tv/top_rated'), () =>
        HttpResponse.json(paged([series(1)], { total_pages: 9000 })),
      ),
    );

    expect((await getList('tv', 'top_rated', 'en')).totalPages).toBe(500);
  });

  it('returns people from a multi search with what they are known for', async () => {
    const result = await search({ kind: 'multi', query: 'dune', page: 1, locale: 'en' });

    expect(result.results.find((r) => r.mediaType === 'person')).toEqual({
      id: 52,
      mediaType: 'person',
      name: 'Person 52',
      profilePath: '/person-52.jpg',
      knownForDepartment: 'Acting',
      knownFor: ['Movie 1', 'Series 11'],
    });
    expect(requestsTo('/search/multi')[0]?.searchParams.get('include_adult')).toBe('false');
  });
});

describe('details', () => {
  it('maps a movie with ordered cast, merged key crew, sorted videos, providers and its collection', async () => {
    const detail = await getMovie(42, 'en');

    expect(detail).toMatchObject({
      id: 42,
      title: 'Movie 42',
      runtime: 155,
      tagline: 'A tagline',
      collection: { id: 900, name: 'The Movie Collection' },
    });
    expect(detail.cast).toHaveLength(12);
    expect(detail.cast[0]?.name).toBe('Actor 14');
    expect(detail.crew).toEqual([
      { id: 201, name: 'Dana Director', jobs: ['Director', 'Screenplay'], profilePath: null },
      { id: 203, name: 'Cam Composer', jobs: ['Original Music Composer'], profilePath: null },
      { id: 200, name: 'Pat Producer', jobs: ['Producer'], profilePath: null },
    ]);
    expect(detail.videos.map((v) => v.key)).toEqual(['trailer1', 'vimeo1', 'clip1']);
    expect(detail.videos[0]).toMatchObject({
      url: 'https://www.youtube.com/watch?v=trailer1',
      thumbnailUrl: 'https://i.ytimg.com/vi/trailer1/hqdefault.jpg',
    });
    expect(detail.providers.US?.flatrate.map((p) => p.name)).toEqual(['Stream One', 'Stream Two']);
    expect(detail.recommendations.map((r) => r.id)).toEqual([43, 44]);
    expect(requestsTo('/movie/42')[0]?.searchParams.get('append_to_response')).toBe(
      'credits,videos,recommendations,watch/providers',
    );
  });

  it('treats a zero runtime as unknown', async () => {
    server.use(http.get(api('/movie/5'), () => HttpResponse.json(movieDetail(5, { runtime: 0 }))));

    expect((await getMovie(5, 'en')).runtime).toBeNull();
  });

  it('maps a series with its seasons, episode length and creator as crew', async () => {
    const detail = await getSeries(7, 'en');

    expect(detail).toMatchObject({ episodeRuntime: 50, numberOfSeasons: 2, numberOfEpisodes: 18 });
    expect(detail.seasons.map((s) => s.seasonNumber)).toEqual([0, 1, 2]);
    expect(detail.crew[0]).toMatchObject({ name: 'Cree Ator', jobs: ['Creator'] });
  });

  it('falls back to the English overview when the translation has none', async () => {
    server.use(
      http.get(api('/tv/7'), ({ request }) => {
        const language = new URL(request.url).searchParams.get('language');
        return HttpResponse.json(
          tvDetail(7, { overview: language === 'en-US' ? 'English overview' : '' }),
        );
      }),
    );

    const detail = await getSeries(7, 'tr');

    expect(detail.overview).toBe('English overview');
    expect(requestsTo('/tv/7').map((url) => url.searchParams.get('language'))).toEqual([
      'tr-TR',
      'en-US',
    ]);
  });

  it('does not make a second request when the translation is complete', async () => {
    server.use(
      http.get(api('/movie/42'), () =>
        HttpResponse.json(movieDetail(42, { overview: 'Türkçe özet', tagline: 'Slogan' })),
      ),
    );

    await getMovie(42, 'tr');

    expect(requestsTo('/movie/42')).toHaveLength(1);
  });

  it('fills missing episode overviews from English', async () => {
    server.use(
      http.get(api('/tv/7/season/1'), ({ request }) => {
        const english = new URL(request.url).searchParams.get('language') === 'en-US';
        return HttpResponse.json({
          season_number: 1,
          name: 'Sezon 1',
          overview: 'Özet',
          episodes: [
            { id: 1, episode_number: 1, name: 'Bölüm 1', overview: english ? 'Pilot episode' : '' },
          ],
        });
      }),
    );

    const season = await getSeason(7, 1, 'tr');

    expect(season.episodes[0]).toMatchObject({ name: 'Bölüm 1', overview: 'Pilot episode' });
  });

  it('groups a filmography by year, newest first, with undated titles first and roles merged', async () => {
    const person = await getPerson(1, 'en');

    expect(person.filmography.map((group) => group.year)).toEqual([null, 2015, 2001]);
    expect(person.filmography[1]?.credits.map((c) => c.title)).toEqual(['A Show', 'Same Year']);
    expect(person.filmography[2]?.credits[0]?.roles).toEqual(['Lead', 'Producer']);
  });

  it('orders collection parts by release date with unreleased parts last', async () => {
    const collection = await getCollection(900, 'en');

    expect(collection.parts.map((p) => p.id)).toEqual([2, 3, 4]);
  });
});
