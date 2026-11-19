import type { WatchlistItem } from '@/lib/watchlist/schema';

export const watchlistItem = (overrides: Partial<WatchlistItem> = {}): WatchlistItem => ({
  id: 1,
  mediaType: 'movie',
  title: 'Movie 1',
  posterPath: '/poster-1.jpg',
  releaseDate: '2021-05-01',
  status: 'to-watch',
  rating: null,
  note: '',
  addedAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  runtime: null,
  ...overrides,
});

export const storeWatchlist = (items: unknown[]) => {
  window.localStorage.setItem('watchlist:v1', JSON.stringify({ version: 1, items }));
};
