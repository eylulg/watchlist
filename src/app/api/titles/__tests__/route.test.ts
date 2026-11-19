import { HttpResponse, http } from 'msw';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { api, requestsTo, server } from '@/test-utils/server';
import { GET } from '../route';

const get = (query: string) => GET(new NextRequest(`http://localhost:3000/api/titles?${query}`));

describe('GET /api/titles', () => {
  it('resolves ids to the fields a row shows, in the requested language', async () => {
    const response = await get('ids=m1,t11&locale=de');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      titles: [
        {
          id: 1,
          mediaType: 'movie',
          title: 'Movie 1',
          posterPath: '/poster-1.jpg',
          releaseDate: '2021-05-01',
        },
        expect.objectContaining({ id: 11, mediaType: 'tv' }),
      ],
    });
    expect(requestsTo('/movie/1')[0]?.searchParams.get('language')).toBe('de-DE');
  });

  it('leaves out a title TMDB no longer has instead of failing the batch', async () => {
    server.use(
      http.get(api('/movie/2'), () =>
        HttpResponse.json({ status_message: 'Not found' }, { status: 404 }),
      ),
    );

    const body = (await (await get('ids=m1,m2')).json()) as { titles: { id: number }[] };

    expect(body.titles.map((title) => title.id)).toEqual([1]);
  });

  it('reports 502 when TMDB itself fails, so the client can retry', async () => {
    server.use(http.get(api('/movie/1'), () => HttpResponse.json({}, { status: 500 })));

    expect((await get('ids=m1')).status).toBe(502);
  });

  it.each([
    ['no ids', 'ids='],
    ['a malformed id', 'ids=m1,x2'],
    [
      'more ids than one request resolves',
      `ids=${Array.from({ length: 26 }, (_, i) => `m${String(i + 1)}`).join(',')}`,
    ],
  ])('rejects %s without calling TMDB', async (_, query) => {
    const response = await get(query);

    expect(response.status).toBe(400);
    expect(requestsTo('/movie/1')).toHaveLength(0);
  });
});
