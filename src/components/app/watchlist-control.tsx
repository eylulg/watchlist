"use client";

import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { BookmarkAdd, Trash01 } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { Button } from "@/components/base/buttons/button";
import { Link } from "@/i18n/navigation";
import { type WatchStatus, type WatchlistTitle, itemKey } from "@/lib/watchlist/schema";
import { useWatchlist, watchlistActions } from "@/lib/watchlist/store";
import { cx } from "@/utils/cx";
import { StatusSelect } from "./status-select";
import { inlineLinkClass, skeletonClass } from "./styles";

interface WatchlistControlProps {
    title: WatchlistTitle;
    /** Estimated minutes to watch the whole title, used for the "hours watched" stat. */
    runtime: number | null;
}

/** The add, status and remove controls on a detail page. */
export const WatchlistControl = ({ title, runtime }: WatchlistControlProps) => {
    const t = useTranslations("Watchlist");
    const { items } = useWatchlist();
    const statusRef = useRef<HTMLSelectElement>(null);
    const addRef = useRef<HTMLButtonElement>(null);
    const key = itemKey(title);
    const item = items?.find((entry) => itemKey(entry) === key);
    const needsRuntime = item !== undefined && item.runtime === null && runtime !== null;

    // Items added from a card do not know their length yet; write it to the store once this page knows it.
    useEffect(() => {
        if (needsRuntime) watchlistActions.update(key, { runtime });
    }, [needsRuntime, key, runtime]);

    // Adding and removing swap the focused control for another one, so focus moves to its replacement.
    function handleAdd() {
        flushSync(() => {
            watchlistActions.add({ ...title, runtime });
        });
        statusRef.current?.focus();
    }

    function handleRemove() {
        flushSync(() => {
            watchlistActions.remove(key);
        });
        addRef.current?.focus();
    }

    function handleStatusChange(status: WatchStatus) {
        watchlistActions.setStatus(key, status);
    }

    if (items === null) {
        return <div aria-hidden="true" className={cx(skeletonClass, "h-10 w-48 rounded-lg")} />;
    }

    if (!item) {
        return (
            <Button ref={addRef} size="md" iconLeading={BookmarkAdd} onClick={handleAdd}>
                {t("add")}
            </Button>
        );
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            <StatusSelect ref={statusRef} label={t("statusLabel")} value={item.status} onChange={handleStatusChange} />
            <Button size="md" color="secondary" iconLeading={Trash01} onClick={handleRemove}>
                {t("removeFromWatchlist")}
            </Button>
            <Link href="/watchlist" className={cx(inlineLinkClass, "pb-2 text-sm")}>
                {t("open")}
            </Link>
        </div>
    );
};
