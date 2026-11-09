import { z } from "zod";
import { type TitleSummary, titleSummarySchema } from "@/api/tmdb";

export const FAVORITES_STORAGE_KEY = "streaming-catalogue:favorites";

const storedFavoritesSchema = z.array(titleSummarySchema);

/** Reads favorites from localStorage. Private mode, blocked storage or corrupt data all fall back to an empty list. */
export const readFavorites = (): TitleSummary[] => {
    try {
        const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = storedFavoritesSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : [];
    } catch {
        return [];
    }
};

/** Writes favorites to localStorage. Returns false when storage is unavailable or full. */
export const writeFavorites = (favorites: TitleSummary[]): boolean => {
    try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
        return true;
    } catch {
        return false;
    }
};

export const favoriteKey = (item: Pick<TitleSummary, "mediaType" | "id">) => `${item.mediaType}:${String(item.id)}`;
