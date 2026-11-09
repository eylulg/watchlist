import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchLg } from "@untitledui/icons";
import { useSearchParams } from "react-router";
import { browseQuery, genresQuery } from "@/api/queries";
import { MEDIA_LABEL, type MediaType, SORT_OPTIONS, type SortOption, sortTitles } from "@/api/tmdb";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { PageHeading } from "@/components/catalogue/page-heading";
import { EmptyResults, ErrorState } from "@/components/catalogue/status-states";
import { TitleGrid, TitleGridSkeleton } from "@/components/catalogue/title-grid";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cx } from "@/utils/cx";

export const SEARCH_DEBOUNCE_MS = 300;
const FIRST_YEAR = 1950;
const ALL = "all";

const isSort = (value: string | null): value is SortOption => SORT_OPTIONS.some((o) => o.id === value);

const toPositiveInt = (value: string | null): number | undefined => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};

const yearItems = (() => {
    const current = new Date().getFullYear();
    const years = Array.from({ length: current - FIRST_YEAR + 1 }, (_, i) => String(current - i));
    return [{ id: ALL, label: "Any year" }, ...years.map((y) => ({ id: y, label: y }))];
})();

const numberFormat = new Intl.NumberFormat("en-US");

interface BrowsePageProps {
    mediaType: MediaType;
    title: string;
    description: string;
}

export const BrowsePage = ({ mediaType, title, description }: BrowsePageProps) => {
    useDocumentTitle(title);
    const labels = MEDIA_LABEL[mediaType];
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get("q")?.trim() ?? "";
    const sortParam = searchParams.get("sort");
    const sort: SortOption = isSort(sortParam) ? sortParam : "rating";
    const genreId = toPositiveInt(searchParams.get("genre"));
    const year = toPositiveInt(searchParams.get("year"));
    const page = toPositiveInt(searchParams.get("page")) ?? 1;

    const updateParams = (changes: Record<string, string | undefined>, { resetPage = true } = {}) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [key, value] of Object.entries(changes)) {
                    if (value === undefined || value === "") next.delete(key);
                    else next.set(key, value);
                }
                if (resetPage) next.delete("page");
                return next;
            },
            { replace: true },
        );
    };

    // The input updates instantly; the URL (and so the request) follows once typing pauses.
    const [searchInput, setSearchInput] = useState(query);
    const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
    useEffect(() => {
        if (debouncedSearch !== query) updateParams({ q: debouncedSearch });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value
    }, [debouncedSearch]);

    const genres = useQuery(genresQuery(mediaType));
    const results = useQuery(browseQuery({ mediaType, query, page, sort, genreId, year }));

    // /search has no sort or genre parameters, so those apply to the current page of search results.
    const titles = useMemo(() => {
        const items = results.data?.results ?? [];
        if (!query) return items;
        const filtered = genreId ? items.filter((t) => t.genreIds.includes(genreId)) : items;
        return sortTitles(filtered, sort);
    }, [results.data, query, genreId, sort]);

    const genreItems = useMemo(
        () => [{ id: ALL, label: "All genres" }, ...(genres.data ?? []).map((g) => ({ id: String(g.id), label: g.name }))],
        [genres.data],
    );

    const hasFilters = Boolean(query || genreId || year);
    const totalPages = results.data?.totalPages ?? 0;
    const totalResults = results.data?.totalResults ?? 0;

    let statusText = `Loading ${labels.plural}…`;
    if (results.isError) statusText = `Could not load ${labels.plural}.`;
    else if (results.data) {
        statusText =
            titles.length === 0
                ? `No ${labels.plural} found.`
                : query && genreId
                  ? `${String(titles.length)} matching ${labels.plural} on this page.`
                  : `${numberFormat.format(totalResults)} ${totalResults === 1 ? labels.singular : labels.plural} found.`;
    }

    const clearFilters = () => {
        setSearchInput("");
        updateParams({ q: undefined, genre: undefined, year: undefined });
    };

    return (
        <>
            <PageHeading title={title} description={description} />

            <div
                role="search"
                aria-label={`Filter ${labels.plural}`}
                className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]"
            >
                <Input
                    label={`Search ${labels.plural}`}
                    placeholder="Title, for example Dune"
                    icon={SearchLg}
                    type="search"
                    value={searchInput}
                    onChange={setSearchInput}
                    className="sm:col-span-2 lg:col-span-1"
                />
                <Select
                    label="Sort by"
                    items={SORT_OPTIONS}
                    value={sort}
                    onChange={(key) => {
                        updateParams({ sort: key === "rating" ? undefined : String(key) });
                    }}
                >
                    {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
                <Select
                    label="Genre"
                    items={genreItems}
                    value={genreId ? String(genreId) : ALL}
                    isDisabled={genres.isError}
                    onChange={(key) => {
                        updateParams({ genre: key === ALL ? undefined : String(key) });
                    }}
                >
                    {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
                <Select
                    label="Release year"
                    items={yearItems}
                    value={year ? String(year) : ALL}
                    onChange={(key) => {
                        updateParams({ year: key === ALL ? undefined : String(key) });
                    }}
                >
                    {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
            </div>

            <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 pb-6">
                <p role="status" aria-live="polite" className="text-sm text-tertiary">
                    {statusText}
                </p>
                {query && <p className="text-xs text-quaternary">Sort and genre apply to each page of search results.</p>}
            </div>

            {results.isPending ? (
                <TitleGridSkeleton label={`Loading ${labels.plural}`} />
            ) : results.isError ? (
                <ErrorState
                    title={`We could not load ${labels.plural}`}
                    error={results.error}
                    onRetry={() => {
                        void results.refetch();
                    }}
                />
            ) : titles.length === 0 ? (
                <EmptyResults
                    title={`No ${labels.plural} found`}
                    description={
                        query
                            ? `Nothing matches "${query}" with these filters. Try another title or clear the filters.`
                            : "Try another genre or year."
                    }
                    actions={
                        hasFilters ? (
                            <Button color="secondary" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <div aria-busy={results.isPlaceholderData} className={cx("transition-opacity", results.isPlaceholderData && "opacity-60")}>
                    <h2 className="sr-only">Results</h2>
                    <TitleGrid titles={titles} label={`${title} results`} />
                    {totalPages > 1 && (
                        <PaginationPageDefault
                            className="mt-10"
                            page={Math.min(page, totalPages)}
                            total={totalPages}
                            onPageChange={(next) => {
                                updateParams({ page: next === 1 ? undefined : String(next) }, { resetPage: false });
                                window.scrollTo({ top: 0 });
                            }}
                        />
                    )}
                </div>
            )}
        </>
    );
};
