"use client";

import { type ChangeEvent, useRef } from "react";
import { flushSync } from "react-dom";
import { BookmarkAdd } from "@untitledui/icons";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { EmptyResults } from "@/components/app/states";
import { pageIntroClass, pageTitleClass, skeletonClass, statusTextClass } from "@/components/app/styles";
import { Button } from "@/components/base/buttons/button";
import { NativeSelect } from "@/components/base/select/select-native";
import { getPathname, useRouter } from "@/i18n/navigation";
import {
    SORT_OPTIONS,
    STATUS_FILTERS,
    TYPE_FILTERS,
    type WatchlistQuery,
    filterAndSort,
    parseWatchlistQuery,
} from "@/lib/watchlist/filter";
import { type WatchlistItem, itemKey } from "@/lib/watchlist/schema";
import { computeStats } from "@/lib/watchlist/stats";
import { useWatchlist, watchlistActions } from "@/lib/watchlist/store";
import { cx } from "@/utils/cx";
import { ImportExport } from "./import-export";
import { SharePanel } from "./share-panel";
import { WatchlistRow } from "./watchlist-row";
import { WatchlistStats } from "./watchlist-stats";

const DEFAULT_QUERY: WatchlistQuery = { status: "all", type: "all", sort: "added-desc" };

export const WatchlistView = () => {
    const t = useTranslations("Watchlist");
    const tf = useTranslations("Filters");
    const ts = useTranslations("Status");
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { items, isPersisted } = useWatchlist();
    const headingRef = useRef<HTMLHeadingElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const statusFilterRef = useRef<HTMLSelectElement>(null);

    const query = parseWatchlistQuery(new URLSearchParams(searchParams.toString()));
    const visible = items ? filterAndSort(items, query, locale) : [];
    const isFiltered = query.status !== "all" || query.type !== "all";

    function setQuery(changes: Partial<WatchlistQuery>) {
        const next = { ...query, ...changes };
        const params: Record<string, string> = {};
        for (const key of ["status", "type", "sort"] as const) {
            if (next[key] !== DEFAULT_QUERY[key]) params[key] = next[key];
        }
        router.replace({ pathname: "/watchlist", query: params }, { scroll: false });
    }

    function handleStatusFilter(event: ChangeEvent<HTMLSelectElement>) {
        setQuery({ status: parseWatchlistQuery(new URLSearchParams({ status: event.target.value })).status });
    }

    function handleTypeFilter(event: ChangeEvent<HTMLSelectElement>) {
        setQuery({ type: parseWatchlistQuery(new URLSearchParams({ type: event.target.value })).type });
    }

    function handleSort(event: ChangeEvent<HTMLSelectElement>) {
        setQuery({ sort: parseWatchlistQuery(new URLSearchParams({ sort: event.target.value })).sort });
    }

    function handleClearFilters() {
        setQuery({ status: "all", type: "all" });
        statusFilterRef.current?.focus();
    }

    // The removed row held focus, so move it to the row that takes its place, or to the heading.
    function handleRemove(item: WatchlistItem) {
        const index = visible.findIndex((entry) => itemKey(entry) === itemKey(item));
        flushSync(() => {
            watchlistActions.remove(itemKey(item));
        });
        const titles = listRef.current?.querySelectorAll<HTMLElement>("[data-row-title]") ?? [];
        const next = titles[Math.min(index, titles.length - 1)];
        if (next) next.focus();
        else headingRef.current?.focus();
    }

    const heading = (
        <div className="flex flex-col gap-2">
            <h1 ref={headingRef} tabIndex={-1} className={cx(pageTitleClass, "rounded-md outline-focus-ring focus-visible:outline-2")}>
                {t("title")}
            </h1>
            <p className={pageIntroClass}>{t("intro")}</p>
        </div>
    );

    if (items === null) {
        return (
            <div className="flex flex-col gap-6" aria-busy="true">
                {heading}
                <div aria-hidden="true" className={cx(skeletonClass, "h-24 rounded-xl")} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {heading}

            {!isPersisted && (
                <p role="alert" className="rounded-lg bg-warning-primary p-3 text-sm text-warning-primary">
                    {t("notPersisted")}
                </p>
            )}

            {items.length === 0 ? (
                <EmptyResults
                    title={t("emptyTitle")}
                    description={t("emptyDescription")}
                    icon={BookmarkAdd}
                    actions={
                        <Button href={getPathname({ href: "/search", locale })} size="md">
                            {t("emptyAction")}
                        </Button>
                    }
                />
            ) : (
                <>
                    <WatchlistStats stats={computeStats(items)} />

                    <section aria-labelledby="list-heading" className="flex flex-col gap-4">
                        <h2 id="list-heading" className="sr-only">
                            {t("listHeading")}
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                            <NativeSelect
                                ref={statusFilterRef}
                                label={tf("status")}
                                size="sm"
                                value={query.status}
                                onChange={handleStatusFilter}
                                options={STATUS_FILTERS.map((value) => ({ value, label: value === "all" ? tf("allStatuses") : ts(value) }))}
                            />
                            <NativeSelect
                                label={tf("type")}
                                size="sm"
                                value={query.type}
                                onChange={handleTypeFilter}
                                options={TYPE_FILTERS.map((value) => ({ value, label: tf(`types.${value}`) }))}
                            />
                            <NativeSelect
                                label={tf("sort")}
                                size="sm"
                                value={query.sort}
                                onChange={handleSort}
                                options={SORT_OPTIONS.map((value) => ({ value, label: tf(`sorts.${value}`) }))}
                            />
                        </div>
                        <p role="status" aria-live="polite" className={statusTextClass}>
                            {t("showing", { shown: visible.length, total: items.length })}
                        </p>
                        {visible.length === 0 ? (
                            <EmptyResults
                                title={t("noMatchesTitle")}
                                headingAs="h3"
                                description={t("noMatchesDescription")}
                                actions={
                                    isFiltered && (
                                        <Button color="secondary" onClick={handleClearFilters}>
                                            {tf("clear")}
                                        </Button>
                                    )
                                }
                            />
                        ) : (
                            <ul ref={listRef} className="flex flex-col gap-4">
                                {visible.map((item) => (
                                    <WatchlistRow key={itemKey(item)} item={item} onRemove={handleRemove} />
                                ))}
                            </ul>
                        )}
                    </section>

                    <SharePanel items={items} />
                </>
            )}

            <ImportExport items={items} />
        </div>
    );
};
