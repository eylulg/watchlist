import type { WatchlistItem } from "./schema";

export const STATUS_FILTERS = ["all", "to-watch", "watching", "watched"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export const TYPE_FILTERS = ["all", "movie", "tv"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

export const SORT_OPTIONS = ["added-desc", "added-asc", "title", "rating", "release"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export interface WatchlistQuery {
    status: StatusFilter;
    type: TypeFilter;
    sort: SortOption;
}

const pick = <T extends string>(allowed: readonly T[], value: string | null, fallback: T): T =>
    value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** Reads filters from the URL, ignoring anything unexpected. */
export const parseWatchlistQuery = (params: URLSearchParams): WatchlistQuery => ({
    status: pick(STATUS_FILTERS, params.get("status"), "all"),
    type: pick(TYPE_FILTERS, params.get("type"), "all"),
    sort: pick(SORT_OPTIONS, params.get("sort"), "added-desc"),
});

export const filterAndSort = (items: WatchlistItem[], { status, type, sort }: WatchlistQuery, locale = "en"): WatchlistItem[] => {
    const filtered = items.filter((item) => (status === "all" || item.status === status) && (type === "all" || item.mediaType === type));
    const byTitle = (a: WatchlistItem, b: WatchlistItem) => a.title.localeCompare(b.title, locale, { sensitivity: "base" });
    switch (sort) {
        case "added-desc":
            return filtered.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
        case "added-asc":
            return filtered.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
        case "title":
            return filtered.sort(byTitle);
        case "rating":
            // Rated first, best first; unrated at the end in title order.
            return filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byTitle(a, b));
        case "release":
            return filtered.sort((a, b) => (b.releaseDate || "0").localeCompare(a.releaseDate || "0") || byTitle(a, b));
    }
};
