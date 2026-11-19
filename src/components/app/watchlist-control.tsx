'use client';

import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@eylulg/ui/button';
import { cx } from '@eylulg/ui/cx';
import { Skeleton } from '@eylulg/ui/skeleton';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { type WatchStatus, type WatchlistTitle, itemKey } from '@/lib/watchlist/schema';
import { useWatchlist, watchlistActions } from '@/lib/watchlist/store';
import { StatusSelect } from './status-select';
import { inlineLinkClass } from './styles';

interface WatchlistControlProps {
  title: WatchlistTitle;
  /** Estimated minutes to watch the whole title, used for the "hours watched" stat. */
  runtime: number | null;
}

/** The add, status and remove controls on a detail page. */
export const WatchlistControl = ({ title, runtime }: WatchlistControlProps) => {
  const t = useTranslations('Watchlist');
  const { items } = useWatchlist();
  const statusRef = useRef<HTMLButtonElement>(null);
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
    return <Skeleton shape='rect' className='h-control-md w-48' />;
  }

  if (!item) {
    return (
      <Button ref={addRef} size='md' iconLeading={BookmarkPlus} onPress={handleAdd}>
        {t('add')}
      </Button>
    );
  }

  return (
    <div className='flex flex-wrap items-end gap-3'>
      <StatusSelect
        ref={statusRef}
        label={t('statusLabel')}
        value={item.status}
        onChange={handleStatusChange}
      />
      <Button size='md' variant='secondary' iconLeading={Trash2} onPress={handleRemove}>
        {t('removeFromWatchlist')}
      </Button>
      <Link href='/watchlist' className={cx(inlineLinkClass, 'pb-2 text-sm')}>
        {t('open')}
      </Link>
    </div>
  );
};
