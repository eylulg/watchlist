'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@eylulg/ui/button';
import { cx } from '@eylulg/ui/cx';
import { Skeleton } from '@eylulg/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { BookmarkPlus, Link2Off } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyResults, ErrorState } from '@/components/app/states';
import {
  inlineLinkClass,
  pageIntroClass,
  pageTitleClass,
  panelTitleClass,
} from '@/components/app/styles';
import { RowList } from '@/components/watchlist/row-list';
import { SharedRow } from '@/components/watchlist/watchlist-row';
import { WatchlistStats } from '@/components/watchlist/watchlist-stats';
import { Link } from '@/i18n/navigation';
import { itemKey } from '@/lib/watchlist/schema';
import { type SharedItem, decodeSharedList } from '@/lib/watchlist/share';
import { computeStats } from '@/lib/watchlist/stats';
import { useWatchlist, watchlistActions } from '@/lib/watchlist/store';
import { fetchTitles } from './titles-api';

/** Placeholder rows while titles load; enough to fill a screen. */
const SKELETON_ROWS = 6;

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
};

const getHash = () => window.location.hash.slice(1);

/** Renders a list packed into the URL fragment by the share panel. Read only; titles are looked up by id and nothing is stored. */
export const SharedView = () => {
  const t = useTranslations('Shared');
  const locale = useLocale();
  // Null on the server and during hydration: the fragment only exists in the browser.
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => null);
  const { items: myItems } = useWatchlist();
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const openLinkRef = useRef<HTMLAnchorElement>(null);

  const list = hash ? decodeSharedList(hash) : null;
  const entries = list?.entries ?? [];
  const titles = useQuery({
    queryKey: ['shared-titles', locale, hash],
    queryFn: ({ signal }) => fetchTitles(entries, locale, signal),
    enabled: entries.length > 0,
  });
  // Entries whose title TMDB no longer knows are left out.
  const items = entries.flatMap((entry): SharedItem[] => {
    const title = titles.data?.get(itemKey(entry));
    return title ? [{ ...entry, ...title }] : [];
  });
  const mine = new Set((myItems ?? []).map(itemKey));
  const missing = items.filter((item) => !mine.has(itemKey(item)));
  const unavailableCount = titles.isSuccess ? entries.length - items.length : 0;

  // The button disables itself once everything is added, so focus moves to the link that appears.
  function handleAddAll() {
    const now = new Date().toISOString();
    flushSync(() => {
      watchlistActions.merge(
        missing.map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          releaseDate: item.releaseDate,
          // Someone else's status and rating are theirs; start fresh.
          status: 'to-watch',
          rating: null,
          note: '',
          addedAt: now,
          updatedAt: now,
          runtime: null,
        })),
      );
      setAddedCount(missing.length);
    });
    openLinkRef.current?.focus();
  }

  function renderRow(item: SharedItem) {
    return <SharedRow item={item} />;
  }

  if (hash === null) {
    return <Skeleton shape='rect' aria-busy='true' className='h-40 rounded-xl' />;
  }

  if (!list) {
    return (
      <EmptyResults
        title={t('invalidTitle')}
        headingLevel={1}
        description={t('invalidDescription')}
        icon={Link2Off}
      />
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-2'>
        <h1 className={pageTitleClass}>{list.name || t('defaultTitle')}</h1>
        <p className={pageIntroClass}>{t('intro')}</p>
      </div>
      <WatchlistStats
        stats={computeStats(entries.map((entry) => ({ ...entry, runtime: null })))}
        headingId='shared-stats'
      />
      <div className='flex flex-wrap items-center gap-4'>
        <Button
          size='md'
          iconLeading={BookmarkPlus}
          isDisabled={missing.length === 0 || myItems === null || titles.isPending}
          onPress={handleAddAll}
        >
          {t('addAll', { count: missing.length })}
        </Button>
        {addedCount !== null && (
          <Link ref={openLinkRef} href='/watchlist' className={cx(inlineLinkClass, 'text-sm')}>
            {t('openMine')}
          </Link>
        )}
      </div>
      <p role='status' aria-live='polite' className='text-sm text-success'>
        {addedCount !== null ? t('added', { count: addedCount }) : ''}
      </p>
      <section aria-labelledby='shared-list' className='flex flex-col gap-4'>
        <h2 id='shared-list' className={panelTitleClass}>
          {t('listHeading', { count: entries.length })}
        </h2>
        {titles.isError ? (
          <ErrorState
            title={t('loadFailedTitle')}
            message={t('loadFailedMessage')}
            headingLevel={3}
          />
        ) : entries.length > 0 && titles.isPending ? (
          <div aria-hidden='true' className='flex flex-col gap-3'>
            {Array.from({ length: Math.min(entries.length, SKELETON_ROWS) }, (_, i) => (
              <Skeleton key={i} shape='rect' className='h-[4.5rem] rounded-xl' />
            ))}
          </div>
        ) : (
          <>
            {unavailableCount > 0 && (
              <p className='text-sm text-tertiary'>
                {t('unavailable', { count: unavailableCount })}
              </p>
            )}
            <RowList items={items} getKey={itemKey} renderRow={renderRow} />
          </>
        )}
      </section>
    </div>
  );
};
