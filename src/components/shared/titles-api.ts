import * as z from 'zod/mini';
import {
  type WatchlistKey,
  type WatchlistTitle,
  itemKey,
  watchlistItemSchema,
} from '@/lib/watchlist/schema';
import type { SharedEntry } from '@/lib/watchlist/share';

/** The route resolves this many ids at once. */
const CHUNK_SIZE = 25;

class TitlesRequestError extends Error {
  constructor(status: number) {
    super(`Resolving titles failed with status ${String(status)}.`);
    this.name = 'TitlesRequestError';
  }
}

const responseSchema = z.object({
  titles: z.array(
    z.pick(watchlistItemSchema, {
      id: true,
      mediaType: true,
      title: true,
      posterPath: true,
      releaseDate: true,
    }),
  ),
});

const fetchChunk = async (
  entries: SharedEntry[],
  locale: string,
  signal?: AbortSignal,
): Promise<WatchlistTitle[]> => {
  const ids = entries
    .map((entry) => `${entry.mediaType === 'movie' ? 'm' : 't'}${String(entry.id)}`)
    .join(',');
  const response = await fetch(`/api/titles?${new URLSearchParams({ ids, locale }).toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new TitlesRequestError(response.status);
  return responseSchema.parse(await response.json()).titles;
};

/** Looks up the title, poster and release date of every entry of a shared list. Removed titles are missing from the map. */
export const fetchTitles = async (
  entries: SharedEntry[],
  locale: string,
  signal?: AbortSignal,
): Promise<Map<WatchlistKey, WatchlistTitle>> => {
  const chunks = Array.from({ length: Math.ceil(entries.length / CHUNK_SIZE) }, (_, i) =>
    entries.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
  );
  const titles = (
    await Promise.all(chunks.map((chunk) => fetchChunk(chunk, locale, signal)))
  ).flat();
  return new Map(titles.map((title) => [itemKey(title), title]));
};
