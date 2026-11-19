import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import { watchlistItem } from '@/test-utils/watchlist';
import { MAX_SHARED_ITEMS, buildShareUrl, decodeSharedList, encodeSharedList } from '../share';

const items = [
  watchlistItem({ id: 1, status: 'watched', rating: 8, note: 'Loved it' }),
  watchlistItem({ id: 2, mediaType: 'tv', status: 'watching' }),
];

describe('share links', () => {
  it('round trips ids, types, statuses and ratings, and leaves titles, posters and notes out', () => {
    const encoded = encodeSharedList(items, { name: 'Weekend' });

    expect(decodeSharedList(encoded)).toEqual({
      name: 'Weekend',
      entries: [
        { id: 1, mediaType: 'movie', status: 'watched', rating: 8 },
        { id: 2, mediaType: 'tv', status: 'watching', rating: null },
      ],
    });
    expect(decodeURIComponent(encoded)).not.toContain('Movie 1');
  });

  it('produces a URL safe fragment for the shared page', () => {
    const url = buildShareUrl('https://watchlist.example', 'de', encodeSharedList(items));

    expect(url).toMatch(/^https:\/\/watchlist\.example\/de\/shared#[A-Za-z0-9+\-$]+$/);
  });

  it('keeps a link for the maximum number of titles under 8,000 characters', () => {
    const many = Array.from({ length: MAX_SHARED_ITEMS + 5 }, (_, i) =>
      watchlistItem({
        id: 100_000 + ((i * 7919) % 900_000),
        mediaType: i % 3 === 0 ? 'tv' : 'movie',
        status: i % 2 === 0 ? 'watched' : 'watching',
        rating: (i % 10) + 1,
        title: 'A long title that would have made the old link huge',
        posterPath: '/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg',
      }),
    );

    const encoded = encodeSharedList(many, { name: 'x'.repeat(80) });

    expect(buildShareUrl('https://watchlist.example', 'en', encoded).length).toBeLessThan(8000);
    expect(decodeSharedList(encoded)?.entries).toHaveLength(MAX_SHARED_ITEMS);
  });

  it.each([
    ['an empty fragment', ''],
    ['text that is not compressed', 'hello'],
    ['a truncated link', encodeSharedList(items).slice(0, 20)],
    [
      'valid JSON with the wrong shape',
      compressToEncodedURIComponent(JSON.stringify({ v: 2, i: ['x1'] })),
    ],
    [
      'an entry with a rating above 10',
      compressToEncodedURIComponent(JSON.stringify({ v: 2, i: 'm1.1z' })),
    ],
    [
      'the old format that carried titles',
      compressToEncodedURIComponent(
        JSON.stringify({ v: 1, i: [['m', 1, 'Dune', '', '2021', 0, 0]] }),
      ),
    ],
    ['a future version', compressToEncodedURIComponent(JSON.stringify({ v: 3, i: '' }))],
  ])('rejects %s', (_, fragment) => {
    expect(decodeSharedList(fragment)).toBeNull();
  });
});
