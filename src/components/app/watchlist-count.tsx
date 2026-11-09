"use client";

import { useTranslations } from "next-intl";
import { useWatchlist } from "@/lib/watchlist/store";

/** Small count bubble next to the Watchlist nav link. */
export const WatchlistCount = () => {
    const t = useTranslations("Nav");
    const { items } = useWatchlist();
    if (!items?.length) return null;
    return (
        <span className="rounded-full bg-brand-secondary px-1.5 text-xs font-medium text-brand-secondary tabular-nums">
            {items.length}
            <span className="sr-only"> {t("watchlistCount", { count: items.length })}</span>
        </span>
    );
};
