import type { WatchStatus, WatchlistItem } from "./schema";

/** Used when the real length is unknown: a typical film, and a typical season of a drama series. */
const FALLBACK_MINUTES = { movie: 110, tv: 10 * 45 } as const;

export interface WatchlistStats {
    total: number;
    byStatus: Record<WatchStatus, number>;
    movies: number;
    series: number;
    /** Hours spent on watched titles. */
    hoursWatched: number;
    /** True when at least one watched title had no known length and a fallback was used. */
    isEstimate: boolean;
    averageRating: number | null;
}

export const computeStats = (items: Pick<WatchlistItem, "status" | "mediaType" | "runtime" | "rating">[]): WatchlistStats => {
    const byStatus: Record<WatchStatus, number> = { "to-watch": 0, watching: 0, watched: 0 };
    let minutes = 0;
    let isEstimate = false;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const item of items) {
        byStatus[item.status] += 1;
        if (item.status === "watched") {
            if (item.runtime === null) isEstimate = true;
            minutes += item.runtime ?? FALLBACK_MINUTES[item.mediaType];
        }
        if (item.rating !== null) {
            ratingSum += item.rating;
            ratingCount += 1;
        }
    }

    return {
        total: items.length,
        byStatus,
        movies: items.filter((i) => i.mediaType === "movie").length,
        series: items.filter((i) => i.mediaType === "tv").length,
        hoursWatched: Math.round((minutes / 60) * 10) / 10,
        isEstimate,
        averageRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    };
};
