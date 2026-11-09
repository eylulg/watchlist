import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type TitleSummary, titleSummarySchema } from "@/api/tmdb";
import { FAVORITES_STORAGE_KEY, favoriteKey, readFavorites, writeFavorites } from "./favorites-storage";

type TitleRef = Pick<TitleSummary, "mediaType" | "id">;

interface FavoritesContextValue {
    favorites: TitleSummary[];
    isFavorite: (item: TitleRef) => boolean;
    toggleFavorite: (item: TitleSummary) => void;
    removeFavorite: (item: TitleRef) => void;
    /** False when the browser refused to store the last change, so favorites only last for this visit. */
    isPersisted: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<TitleSummary[]>(readFavorites);
    const [isPersisted, setIsPersisted] = useState(true);

    // Keep several open tabs in sync.
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === FAVORITES_STORAGE_KEY) setFavorites(readFavorites());
        };
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    const save = useCallback((next: TitleSummary[]) => {
        setFavorites(next);
        setIsPersisted(writeFavorites(next));
    }, []);

    const value = useMemo<FavoritesContextValue>(() => {
        const keys = new Set(favorites.map(favoriteKey));
        const without = (item: TitleRef) => favorites.filter((f) => favoriteKey(f) !== favoriteKey(item));
        return {
            favorites,
            isPersisted,
            isFavorite: (item) => keys.has(favoriteKey(item)),
            toggleFavorite: (item) => {
                // Store only the summary fields, never extra data from a detail response.
                save(keys.has(favoriteKey(item)) ? without(item) : [titleSummarySchema.parse(item), ...favorites]);
            },
            removeFavorite: (item) => {
                save(without(item));
            },
        };
    }, [favorites, isPersisted, save]);

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = (): FavoritesContextValue => {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
    return context;
};
