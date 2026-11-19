import type { Paged, SearchKind, SearchResult } from '@/lib/tmdb/types';

export class SearchRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Search failed with status ${String(status)}.`);
    this.name = 'SearchRequestError';
    this.status = status;
  }
}

export const fetchSearchPage = async (
  { query, kind, page, locale }: { query: string; kind: SearchKind; page: number; locale: string },
  signal?: AbortSignal,
): Promise<Paged<SearchResult>> => {
  const params = new URLSearchParams({ q: query, type: kind, page: String(page), locale });
  const response = await fetch(`/api/search?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new SearchRequestError(response.status);
  return (await response.json()) as Paged<SearchResult>;
};
