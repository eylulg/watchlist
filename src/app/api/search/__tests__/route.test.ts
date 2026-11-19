import { HttpResponse, http } from 'msw';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { api, requestsTo, server } from '@/test-utils/server';
import { GET } from '../route';

const get = (query: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://localhost:3000/api/search?${query}`, { headers }));

describe('GET /api/search', () => {
  it('searches TMDB in the requested language and returns normalised results', async () => {
    const response = await get('q=dune&type=movie&page=2&locale=tr');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      results: [{ id: 50, mediaType: 'movie', title: 'dune part one' }, { id: 51 }],
    });
    const [url] = requestsTo('/search/movie');
    expect(url?.searchParams.get('language')).toBe('tr-TR');
    expect(url?.searchParams.get('page')).toBe('2');
  });

  it.each([
    ['an empty query', 'q=%20'],
    ['an unknown type', 'q=dune&type=books'],
    ["a page past TMDB's limit", 'q=dune&page=501'],
    ['an unsupported locale', 'q=dune&locale=fr'],
  ])('rejects %s without calling TMDB', async (_, query) => {
    const response = await get(query);

    expect(response.status).toBe(400);
    expect(requestsTo('/search/multi')).toHaveLength(0);
  });

  it('refuses cross site requests', async () => {
    const response = await get('q=dune', { 'sec-fetch-site': 'cross-site' });

    expect(response.status).toBe(403);
  });

  it("hides TMDB's error message, which can mention the key", async () => {
    server.use(
      http.get(api('/search/multi'), () =>
        HttpResponse.json({ status_message: 'Invalid API key: abc123' }, { status: 401 }),
      ),
    );

    const response = await get('q=dune');

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain('abc123');
  });
});
