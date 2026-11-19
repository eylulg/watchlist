'use client';

import { IconButton } from '@eylulg/ui/icon-button';
import { BookmarkCheck, BookmarkPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type WatchlistTitle, itemKey } from '@/lib/watchlist/schema';
import { useWatchlist, watchlistActions } from '@/lib/watchlist/store';

/** Compact add or remove button in the corner of a card. */
export const WatchlistToggle = ({ title }: { title: WatchlistTitle }) => {
  const t = useTranslations('Watchlist');
  const { items } = useWatchlist();
  const key = itemKey(title);
  const isSaved = items?.some((item) => itemKey(item) === key) ?? false;

  function handlePress() {
    if (isSaved) watchlistActions.remove(key);
    else watchlistActions.add(title);
  }

  return (
    <IconButton
      aria-label={
        isSaved ? t('removeNamed', { title: title.title }) : t('addNamed', { title: title.title })
      }
      aria-pressed={isSaved}
      variant='secondary'
      size='sm'
      className='absolute top-2 right-2 z-10'
      icon={isSaved ? BookmarkCheck : BookmarkPlus}
      onPress={handlePress}
    />
  );
};
