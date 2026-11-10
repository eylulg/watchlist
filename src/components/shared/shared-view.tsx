"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Button } from "@eylulg/ui/button";
import { cx } from "@eylulg/ui/cx";
import { Skeleton } from "@eylulg/ui/skeleton";
import { BookmarkPlus, Link2Off } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyResults } from "@/components/app/states";
import { inlineLinkClass, pageIntroClass, pageTitleClass, panelTitleClass } from "@/components/app/styles";
import { SharedRow } from "@/components/watchlist/watchlist-row";
import { WatchlistStats } from "@/components/watchlist/watchlist-stats";
import { Link } from "@/i18n/navigation";
import { itemKey } from "@/lib/watchlist/schema";
import { decodeSharedList } from "@/lib/watchlist/share";
import { computeStats } from "@/lib/watchlist/stats";
import { useWatchlist, watchlistActions } from "@/lib/watchlist/store";

const subscribeToHash = (onChange: () => void) => {
    window.addEventListener("hashchange", onChange);
    return () => {
        window.removeEventListener("hashchange", onChange);
    };
};

const getHash = () => window.location.hash.slice(1);

/** Renders a list packed into the URL fragment by the share panel. Read only; nothing is fetched or stored. */
export const SharedView = () => {
    const t = useTranslations("Shared");
    // Null on the server and during hydration: the fragment only exists in the browser.
    const hash = useSyncExternalStore(subscribeToHash, getHash, () => null);
    const { items: myItems } = useWatchlist();
    const [addedCount, setAddedCount] = useState<number | null>(null);
    const openLinkRef = useRef<HTMLAnchorElement>(null);

    const list = hash ? decodeSharedList(hash) : null;
    const mine = new Set((myItems ?? []).map(itemKey));
    const missing = list?.items.filter((item) => !mine.has(itemKey(item))) ?? [];

    // The button disables itself once everything is added, so focus moves to the link that appears.
    function handleAddAll() {
        const now = new Date().toISOString();
        flushSync(() => {
            watchlistActions.merge(
                missing.map((item) => ({
                    ...item,
                    // Someone else's status, rating and notes are theirs; start fresh.
                    status: "to-watch",
                    rating: null,
                    note: "",
                    addedAt: now,
                    updatedAt: now,
                    runtime: null,
                })),
            );
            setAddedCount(missing.length);
        });
        openLinkRef.current?.focus();
    }

    if (hash === null) {
        return <Skeleton shape="rect" aria-busy="true" className="h-40 rounded-xl" />;
    }

    if (!list) {
        return <EmptyResults title={t("invalidTitle")} headingLevel={1} description={t("invalidDescription")} icon={Link2Off} />;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className={pageTitleClass}>{list.name || t("defaultTitle")}</h1>
                <p className={pageIntroClass}>{t("intro")}</p>
            </div>
            <WatchlistStats stats={computeStats(list.items.map((item) => ({ ...item, runtime: null })))} headingId="shared-stats" />
            <div className="flex flex-wrap items-center gap-4">
                <Button size="md" iconLeading={BookmarkPlus} isDisabled={missing.length === 0 || myItems === null} onPress={handleAddAll}>
                    {t("addAll", { count: missing.length })}
                </Button>
                {addedCount !== null && (
                    <Link ref={openLinkRef} href="/watchlist" className={cx(inlineLinkClass, "text-sm")}>
                        {t("openMine")}
                    </Link>
                )}
            </div>
            <p role="status" aria-live="polite" className="text-sm text-success">
                {addedCount !== null ? t("added", { count: addedCount }) : ""}
            </p>
            <section aria-labelledby="shared-list" className="flex flex-col gap-4">
                <h2 id="shared-list" className={panelTitleClass}>
                    {t("listHeading", { count: list.items.length })}
                </h2>
                <ul className="flex flex-col gap-4">
                    {list.items.map((item) => (
                        <SharedRow key={itemKey(item)} item={item} />
                    ))}
                </ul>
            </section>
        </div>
    );
};
