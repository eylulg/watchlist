import { describe, expect, it } from 'vitest';
import nextConfig from '../../../../next.config';
import { getMovie } from '../client';
import { tmdbImage } from '../images';

const patterns = nextConfig.images?.remotePatterns ?? [];

/** Mirrors next/image's check: same protocol and host, and a path under the pattern's prefix. */
const isAllowed = (src: string) => {
  const url = new URL(src);
  return patterns.some(
    (pattern) =>
      !(pattern instanceof URL) &&
      `${pattern.protocol ?? 'https'}:` === url.protocol &&
      pattern.hostname === url.hostname &&
      url.pathname.startsWith((pattern.pathname ?? '/').replace('**', '')),
  );
};

describe('remote images', () => {
  it('allows every image host the app renders through next/image', async () => {
    const movie = await getMovie(42, 'en');
    const sources = [
      tmdbImage('/poster.jpg'),
      tmdbImage('/logo.png', 'w92'),
      ...movie.videos.flatMap((video) => video.thumbnailUrl ?? []),
    ];

    expect(sources.filter((src) => !isAllowed(src))).toEqual([]);
  });
});
