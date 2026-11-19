import { type WatchlistItem, parseItems, watchlistDocumentSchema } from './schema';

export const WATCHLIST_STORAGE_KEY = 'watchlist:v1';

/** Reads the watchlist from localStorage. Private mode, blocked storage or corrupt data all fall back to an empty list. */
export const readWatchlist = (): WatchlistItem[] => {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = watchlistDocumentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parseItems(parsed.data.items).items : [];
  } catch {
    return [];
  }
};

/** Writes the watchlist to localStorage. Returns false when storage is unavailable or full. */
export const writeWatchlist = (items: WatchlistItem[]): boolean => {
  try {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify({ version: 1, items }));
    return true;
  } catch {
    return false;
  }
};
