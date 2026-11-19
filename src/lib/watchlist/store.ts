'use client';

import { useSyncExternalStore } from 'react';
import {
  type WatchStatus,
  type WatchlistItem,
  type WatchlistKey,
  type WatchlistTitle,
  itemKey,
  watchlistItemSchema,
} from './schema';
import { WATCHLIST_STORAGE_KEY, readWatchlist, writeWatchlist } from './storage';

export interface WatchlistState {
  /** Null until the list has been read from storage on the client. */
  items: WatchlistItem[] | null;
  /** False when the browser refused to store the last change, so it only lasts for this visit. */
  isPersisted: boolean;
}

const SERVER_STATE: WatchlistState = { items: null, isPersisted: true };

let state: WatchlistState | null = null;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const getState = (): WatchlistState => {
  state ??= { items: readWatchlist(), isPersisted: true };
  return state;
};

const onStorage = (event: StorageEvent) => {
  // Another tab changed the list (event.key is null when storage was cleared).
  if (event.key === WATCHLIST_STORAGE_KEY || event.key === null) {
    state = { items: readWatchlist(), isPersisted: getState().isPersisted };
    emit();
  }
};

const subscribe = (listener: () => void) => {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
};

const save = (items: WatchlistItem[]) => {
  state = { items, isPersisted: writeWatchlist(items) };
  emit();
};

const current = () => getState().items ?? [];
const now = () => new Date().toISOString();

type NewWatchlistItem = WatchlistTitle & Partial<Pick<WatchlistItem, 'status' | 'runtime'>>;

export const watchlistActions = {
  add(input: NewWatchlistItem) {
    const key = itemKey(input);
    if (current().some((item) => itemKey(item) === key)) return;
    const timestamp = now();
    // Parse so only known fields are stored, never extra data from a detail response.
    const item = watchlistItemSchema.parse({
      id: input.id,
      mediaType: input.mediaType,
      title: input.title,
      posterPath: input.posterPath,
      releaseDate: input.releaseDate,
      status: input.status ?? 'to-watch',
      rating: null,
      note: '',
      addedAt: timestamp,
      updatedAt: timestamp,
      runtime: input.runtime ?? null,
    });
    save([item, ...current()]);
  },
  update(
    key: WatchlistKey,
    changes: Partial<Pick<WatchlistItem, 'status' | 'rating' | 'note' | 'runtime'>>,
  ) {
    save(
      current().map((item) => {
        if (itemKey(item) !== key) return item;
        const next = watchlistItemSchema.safeParse({ ...item, ...changes, updatedAt: now() });
        return next.success ? next.data : item;
      }),
    );
  },
  setStatus(key: WatchlistKey, status: WatchStatus) {
    watchlistActions.update(key, { status });
  },
  remove(key: WatchlistKey) {
    save(current().filter((item) => itemKey(item) !== key));
  },
  /** Adds imported items. An imported item replaces the stored one with the same title. */
  merge(incoming: WatchlistItem[]) {
    const keys = new Set(incoming.map(itemKey));
    save([...incoming, ...current().filter((item) => !keys.has(itemKey(item)))]);
  },
  clear() {
    save([]);
  },
};

export const useWatchlist = (): WatchlistState =>
  useSyncExternalStore(subscribe, getState, () => SERVER_STATE);

/** For tests: forget the cached state so the next read comes from storage again. */
export const resetWatchlistStore = () => {
  state = null;
};
