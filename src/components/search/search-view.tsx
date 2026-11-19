'use client';

import { type RefObject, type SubmitEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@eylulg/ui/button';
import { Input } from '@eylulg/ui/input';
import { Tag, TagGroup } from '@eylulg/ui/tag';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import type { Key, Selection } from 'react-aria-components';
import { PersonCard } from '@/components/app/person-card';
import { CardGrid, EmptyResults, ErrorState } from '@/components/app/states';
import { posterGridClass, statusTextClass } from '@/components/app/styles';
import { TitleCard, TitleCardSkeleton } from '@/components/app/title-card';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { useRouter } from '@/i18n/navigation';
import { GRID_POSTER_SIZES } from '@/lib/tmdb/images';
import { SEARCH_KINDS, type SearchKind, type SearchResult } from '@/lib/tmdb/types';
import { SearchRequestError, fetchSearchPage } from './search-api';

const DEBOUNCE_MS = 300;

/** The same limit the search route validates, so a longer query is cut in the field instead of refused later. */
const MAX_QUERY_LENGTH = 200;

const isSearchKind = (value: Key | null | undefined): value is SearchKind =>
  SEARCH_KINDS.some((kind) => kind === value);

const resultKey = (result: SearchResult) => `${result.mediaType}-${String(result.id)}`;

/** TanStack Query keeps a failed page load in its error state, which the view renders. */
const keepErrorInQueryState = () => undefined;

/** TMDB pages can overlap while results shift between requests, so drop repeats. */
const uniqueResults = (pages: { results: SearchResult[] }[]) => {
  const seen = new Set<string>();
  return pages
    .flatMap((page) => page.results)
    .filter((result) => {
      const key = resultKey(result);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const SearchView = () => {
  const t = useTranslations('Search');
  const tErrors = useTranslations('Errors');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get('q') ?? '').trim();
  const rawKind = searchParams.get('type');
  const kind: SearchKind = isSearchKind(rawKind) ? rawKind : 'multi';

  const search = useInfiniteQuery({
    queryKey: ['search', locale, kind, urlQuery],
    queryFn: ({ pageParam, signal }) =>
      fetchSearchPage({ query: urlQuery, kind, page: pageParam, locale }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: urlQuery.length > 0,
  });
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = search;

  const [input, setInput] = useState(urlQuery);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const results = uniqueResults(search.data?.pages ?? []);
  const total = search.data?.pages[0]?.totalResults ?? 0;
  const status = !urlQuery
    ? ''
    : search.isPending
      ? t('searching')
      : search.isSuccess
        ? total === 0
          ? t('noResultsStatus', { query: urlQuery })
          : t('resultCount', { count: total, shown: results.length, query: urlQuery })
        : '';

  function replaceUrl(query: string, nextKind: SearchKind) {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (nextKind !== 'multi') params.type = nextKind;
    router.replace({ pathname: '/search', query: params }, { scroll: false });
  }

  // The URL is the source of truth for what is searched; typing updates it once the user pauses.
  const debouncedReplaceUrl = useDebouncedCallback(replaceUrl, DEBOUNCE_MS);

  // Back and forward change the URL without touching the field, so copy the query back into it.
  useEffect(() => {
    function handlePopState() {
      debouncedReplaceUrl.cancel();
      setInput(new URLSearchParams(window.location.search).get('q') ?? '');
    }
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [debouncedReplaceUrl]);

  useEffect(() => {
    // The first placeholder starts the next page while scrolling; the end of the list covers a jump straight to the bottom.
    const sentinels = [sentinelRef.current, endRef.current].filter((element) => element !== null);
    if (
      sentinels.length === 0 ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          fetchNextPage().catch(keepErrorInQueryState);
      },
      { rootMargin: '600px 0px' },
    );
    for (const sentinel of sentinels) observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  function handleInputChange(value: string) {
    setInput(value);
    debouncedReplaceUrl.run(value.trim(), kind);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    debouncedReplaceUrl.cancel();
    replaceUrl(input.trim(), kind);
  }

  function handleKindChange(keys: Selection) {
    const [next] = keys === 'all' ? [] : [...keys];
    if (!isSearchKind(next)) return;
    debouncedReplaceUrl.cancel();
    replaceUrl(input.trim(), next);
  }

  function handleLoadMore() {
    fetchNextPage().catch(keepErrorInQueryState);
  }

  function handleRetry() {
    search.refetch().catch(keepErrorInQueryState);
  }

  return (
    <div className='flex flex-col gap-6'>
      <form role='search' className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <Input
          label={t('label')}
          type='search'
          iconLeading={Search}
          size='md'
          placeholder={t('placeholder')}
          hint={t('lengthHint', { max: MAX_QUERY_LENGTH })}
          maxLength={MAX_QUERY_LENGTH}
          value={input}
          onChange={handleInputChange}
          className='max-w-xl'
        />
        <TagGroup
          aria-label={t('kindLabel')}
          selectionMode='single'
          selectedKeys={[kind]}
          disallowEmptySelection
          onSelectionChange={handleKindChange}
        >
          {SEARCH_KINDS.map((option) => (
            <Tag key={option} id={option}>
              {t(`kinds.${option}`)}
            </Tag>
          ))}
        </TagGroup>
      </form>

      <p role='status' aria-live='polite' className={statusTextClass}>
        {status}
      </p>

      <SearchResults
        query={urlQuery}
        results={results}
        pageCount={search.data?.pages.length ?? 0}
        hasNextPage={hasNextPage}
        sentinelRef={sentinelRef}
        isPending={search.isPending}
        isError={search.isError && results.length === 0}
        isInvalid={search.error instanceof SearchRequestError && search.error.status === 400}
        onRetry={handleRetry}
      />

      {results.length > 0 && (
        <div ref={endRef} className='flex flex-col items-center gap-3'>
          {isFetchNextPageError && (
            <p className='text-sm text-error'>{tErrors('loadMoreFailed')}</p>
          )}
          {hasNextPage && (
            <Button
              variant='secondary'
              size='md'
              isLoading={isFetchingNextPage}
              loadingLabel={t('loadMore')}
              onPress={handleLoadMore}
            >
              {t('loadMore')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/** TMDB pages hold 20 results. Reserving that much room is what keeps the footer from jumping when a page arrives. */
const RESULTS_PER_PAGE = 20;

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  /** Pages loaded so far. */
  pageCount: number;
  hasNextPage: boolean;
  /** Attached to the first placeholder, so the next page loads when it nears the viewport. */
  sentinelRef: RefObject<HTMLLIElement | null>;
  isPending: boolean;
  isError: boolean;
  /** The app's own route refused the query, which is a validation problem and not an outage. */
  isInvalid: boolean;
  onRetry: () => void;
}

const SearchResults = ({
  query,
  results,
  pageCount,
  hasNextPage,
  sentinelRef,
  isPending,
  isError,
  isInvalid,
  onRetry,
}: SearchResultsProps) => {
  const t = useTranslations('Search');
  const tErrors = useTranslations('Errors');

  if (!query) return <EmptyResults title={t('emptyTitle')} description={t('emptyDescription')} />;

  if (isError && isInvalid) {
    return (
      <ErrorState
        title={tErrors('searchInvalidTitle')}
        message={tErrors('searchInvalidMessage', { max: MAX_QUERY_LENGTH })}
      />
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={tErrors('searchTitle')}
        message={tErrors('searchMessage')}
        actions={<Button onPress={onRetry}>{tErrors('retry')}</Button>}
      />
    );
  }

  if (isPending) {
    return (
      <div aria-hidden='true' className={posterGridClass}>
        {Array.from({ length: 12 }, (_, i) => (
          <TitleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0)
    return (
      <EmptyResults
        title={t('noResultsTitle')}
        description={t('noResultsDescription', { query })}
      />
    );

  return (
    <section aria-labelledby='search-results' className='flex flex-col gap-4'>
      <h2 id='search-results' className='sr-only'>
        {t('resultsLabel')}
      </h2>
      <CardGrid>
        {results.map((result) => (
          <li key={resultKey(result)}>
            {result.mediaType === 'person' ? (
              <PersonCard
                id={result.id}
                name={result.name}
                profilePath={result.profilePath}
                detail={result.knownFor.join(', ') || result.knownForDepartment}
                sizes={GRID_POSTER_SIZES}
              />
            ) : (
              <TitleCard title={result} sizes={GRID_POSTER_SIZES} />
            )}
          </li>
        ))}
        {hasNextPage &&
          Array.from({ length: RESULTS_PER_PAGE }, (_, i) => (
            // A new key for every page, so the placeholders are replaced by the cards that arrive rather than
            // pushed down the page, which would count as layout shift.
            <li
              key={`next-${String(pageCount)}-${String(i)}`}
              ref={i === 0 ? sentinelRef : undefined}
              aria-hidden='true'
            >
              <TitleCardSkeleton />
            </li>
          ))}
      </CardGrid>
    </section>
  );
};
