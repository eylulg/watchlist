"use client";

import { BookmarkAdd, BookmarkCheck } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { type WatchlistTitle, itemKey } from "@/lib/watchlist/schema";
import { useWatchlist, watchlistActions } from "@/lib/watchlist/store";

/** Compact add or remove button in the corner of a card. */
export const WatchlistToggle = ({ title }: { title: WatchlistTitle }) => {
    const t = useTranslations("Watchlist");
    const { items } = useWatchlist();
    const key = itemKey(title);
    const isSaved = items?.some((item) => itemKey(item) === key) ?? false;

    function handlePress() {
        if (isSaved) watchlistActions.remove(key);
        else watchlistActions.add(title);
    }

    return (
        <ButtonUtility
            aria-label={isSaved ? t("removeNamed", { title: title.title }) : t("addNamed", { title: title.title })}
            aria-pressed={isSaved}
            color="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-primary/90 backdrop-blur"
            icon={isSaved ? <BookmarkCheck data-icon aria-hidden="true" className="text-fg-brand-primary" /> : BookmarkAdd}
            onPress={handlePress}
        />
    );
};
