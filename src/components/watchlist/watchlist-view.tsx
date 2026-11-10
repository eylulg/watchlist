"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
import { Button } from "@eylulg/ui/button";
import { cx } from "@eylulg/ui/cx";
import { Select, SelectItem } from "@eylulg/ui/select";
import { Skeleton } from "@eylulg/ui/skeleton";
import { Tag, TagGroup } from "@eylulg/ui/tag";
import { BookmarkPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { Selection } from "react-aria-components";
import { LinkButton } from "@/components/app/link-button";
import { EmptyResults } from "@/components/app/states";
import { pageIntroClass, pageTitleClass, statusTextClass } from "@/components/app/styles";
import { useRouter } from "@/i18n/navigation";
import { focusFirstControl } from "@/lib/focus";
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
    const filtersRef = useRef<HTMLDivElement>(null);

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

    function handleStatusFilter(key: unknown) {
        setQuery({ status: parseWatchlistQuery(new URLSearchParams({ status: String(key) })).status });
    }

    function handleTypeFilter(keys: Selection) {
        const [key] = keys === "all" ? [] : [...keys];
        setQuery({ type: parseWatchlistQuery(new URLSearchParams({ type: String(key) })).type });
    }

    function handleSort(key: unknown) {
        setQuery({ sort: parseWatchlistQuery(new URLSearchParams({ sort: String(key) })).sort });
    }

    function handleClearFilters() {
        setQuery({ status: "all", type: "all" });
        focusFirstControl(filtersRef.current);
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
            <h1 ref={headingRef} tabIndex={-1} className={cx(pageTitleClass, "rounded-md outline-focus focus-visible:outline-2")}>
                {t("title")}
            </h1>
            <p className={pageIntroClass}>{t("intro")}</p>
        </div>
    );

    if (items === null) {
        return (
            <div className="flex flex-col gap-6" aria-busy="true">
                {heading}
                <Skeleton shape="rect" className="h-24 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {heading}

            {!isPersisted && (
                <p role="alert" className="rounded-lg bg-warning-subtle p-3 text-sm text-warning">
                    {t("notPersisted")}
                </p>
            )}

            {items.length === 0 ? (
                <EmptyResults
                    title={t("emptyTitle")}
                    description={t("emptyDescription")}
                    icon={BookmarkPlus}
                    actions={<LinkButton href="/search">{t("emptyAction")}</LinkButton>}
                />
            ) : (
                <>
                    <WatchlistStats stats={computeStats(items)} />

                    <section aria-labelledby="list-heading" className="flex flex-col gap-4">
                        <h2 id="list-heading" className="sr-only">
                            {t("listHeading")}
                        </h2>
                        <div ref={filtersRef} className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
                            <Select
                                label={tf("status")}
                                value={query.status}
                                onChange={handleStatusFilter}
                                items={STATUS_FILTERS.map((value) => ({
                                    id: value,
                                    name: value === "all" ? tf("allStatuses") : ts(value),
                                }))}
                            >
                                {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
                            </Select>
                            <TagGroup
                                label={tf("type")}
                                selectionMode="single"
                                selectedKeys={[query.type]}
                                disallowEmptySelection
                                onSelectionChange={handleTypeFilter}
                            >
                                {TYPE_FILTERS.map((value) => (
                                    <Tag key={value} id={value}>
                                        {tf(`types.${value}`)}
                                    </Tag>
                                ))}
                            </TagGroup>
                            <Select
                                label={tf("sort")}
                                value={query.sort}
                                onChange={handleSort}
                                items={SORT_OPTIONS.map((value) => ({ id: value, name: tf(`sorts.${value}`) }))}
                            >
                                {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
                            </Select>
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
                                        <Button variant="secondary" onPress={handleClearFilters}>
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
