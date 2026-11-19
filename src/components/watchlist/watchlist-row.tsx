'use client';

import { useId, useState } from 'react';
import { Badge } from '@eylulg/ui/badge';
import { Button } from '@eylulg/ui/button';
import { cx } from '@eylulg/ui/cx';
import { IconButton } from '@eylulg/ui/icon-button';
import { Select, SelectItem } from '@eylulg/ui/select';
import { Textarea } from '@eylulg/ui/textarea';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { StatusSelect } from '@/components/app/status-select';
import { Thumb } from '@/components/app/thumb';
import { Link } from '@/i18n/navigation';
import { releaseYear, titleHref } from '@/lib/tmdb/types';
import { type WatchStatus, type WatchlistItem, itemKey } from '@/lib/watchlist/schema';
import type { SharedItem } from '@/lib/watchlist/share';
import { watchlistActions } from '@/lib/watchlist/store';

interface WatchlistRowProps {
  item: WatchlistItem;
  onRemove: (item: WatchlistItem) => void;
}

const STATUS_BADGE_COLOR = { 'to-watch': 'gray', watching: 'brand', watched: 'success' } as const;

const rowClass = 'rounded-xl ring-1 ring-default';
const thumbClass = 'w-10 rounded-md sm:w-12';

const ratingOptions = (t: ReturnType<typeof useTranslations<'Watchlist'>>) => [
  { id: 'none', name: t('notRated') },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: String(10 - i),
    name: t('ratingOption', { rating: 10 - i }),
  })),
];

/**
 * One watchlist entry on one line: poster, title, status and rating as small controls. The note, the
 * date and Remove sit behind the expand button, so a long list can be scanned instead of scrolled.
 */
export const WatchlistRow = ({ item, onRemove }: WatchlistRowProps) => {
  const t = useTranslations('Watchlist');
  const format = useFormatter();
  const detailsId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const key = itemKey(item);

  function handleStatusChange(status: WatchStatus) {
    watchlistActions.setStatus(key, status);
  }

  function handleRatingChange(value: unknown) {
    const rating = Number(value);
    watchlistActions.update(key, {
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 10 ? rating : null,
    });
  }

  function handleToggle() {
    setIsExpanded((expanded) => !expanded);
  }

  function handleRemove() {
    onRemove(item);
  }

  return (
    <div className={rowClass}>
      <div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 p-2 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:p-3'>
        <Thumb path={item.posterPath} className={thumbClass} sizes='48px' />
        <Heading item={item} note={item.note} />
        {/* Phones put both controls on a second line; from sm up they join the row as grid cells. */}
        <div className='col-span-3 flex gap-2 sm:contents'>
          <StatusSelect
            ariaLabel={t('statusFor', { title: item.title })}
            value={item.status}
            onChange={handleStatusChange}
            className='min-w-0 flex-1 sm:w-36 sm:flex-none'
          />
          <div className='min-w-0 flex-1 sm:w-32 sm:flex-none'>
            <Select
              aria-label={t('ratingFor', { title: item.title })}
              value={item.rating === null ? 'none' : String(item.rating)}
              onChange={handleRatingChange}
              items={ratingOptions(t)}
            >
              {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
            </Select>
          </div>
        </div>
        <IconButton
          variant='tertiary'
          icon={isExpanded ? ChevronUp : ChevronDown}
          aria-label={t(isExpanded ? 'hideDetails' : 'showDetails', { title: item.title })}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          onPress={handleToggle}
          className='col-start-3 row-start-1 sm:col-start-5'
        />
      </div>
      {isExpanded && (
        <div
          id={detailsId}
          className='flex flex-col gap-3 border-t border-subtle p-3 sm:flex-row sm:items-end'
        >
          {/* Keyed by the saved note, so an edit from another tab replaces the field's draft. */}
          <NoteField key={item.note} item={item} />
          <div className='flex items-center justify-between gap-3 sm:flex-col sm:items-end'>
            <p className='text-xs text-tertiary'>
              {t('addedOn', {
                date: format.dateTime(new Date(item.addedAt), { dateStyle: 'medium' }),
              })}
            </p>
            <Button
              variant='secondary'
              size='md'
              iconLeading={Trash2}
              aria-label={t('removeNamed', { title: item.title })}
              onPress={handleRemove}
            >
              {t('remove')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/** A read only entry for shared lists. */
export const SharedRow = ({ item }: { item: SharedItem }) => {
  const t = useTranslations('Watchlist');
  const ts = useTranslations('Status');
  return (
    <div className={cx(rowClass, 'flex items-center gap-3 p-2 sm:p-3')}>
      <Thumb path={item.posterPath} className={thumbClass} sizes='48px' />
      <Heading item={item} />
      <div className='flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3'>
        <Badge color={STATUS_BADGE_COLOR[item.status]} size='sm'>
          {ts(item.status)}
        </Badge>
        {item.rating !== null && (
          <span className='text-sm text-secondary'>
            {t('ratingOption', { rating: item.rating })}
          </span>
        )}
      </div>
    </div>
  );
};

const NoteField = ({ item }: { item: WatchlistItem }) => {
  const t = useTranslations('Watchlist');
  const [note, setNote] = useState(item.note);

  function handleBlur() {
    if (note !== item.note) watchlistActions.update(itemKey(item), { note });
  }

  // The visible caption is shared by every row, so the field's own name includes the title.
  return (
    <div className='flex flex-1 flex-col gap-1.5'>
      <span aria-hidden='true' className='text-sm font-medium text-secondary'>
        {t('noteLabel')}
      </span>
      <Textarea
        aria-label={t('noteFor', { title: item.title })}
        placeholder={t('notePlaceholder')}
        rows={2}
        maxLength={1000}
        value={note}
        onChange={setNote}
        onBlur={handleBlur}
      />
    </div>
  );
};

const Heading = ({
  item,
  note,
}: {
  item: Pick<SharedItem, 'mediaType' | 'title' | 'releaseDate' | 'id'>;
  note?: string;
}) => {
  const tc = useTranslations('Common');
  const year = releaseYear(item.releaseDate);
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <h3 className='line-clamp-2 text-md font-semibold text-primary'>
        <Link
          href={titleHref(item)}
          data-row-title
          className='outline-focus hover:underline focus-visible:outline-2'
        >
          {item.title}
        </Link>
      </h3>
      <p className='truncate text-sm text-tertiary'>
        {[tc(item.mediaType === 'movie' ? 'movie' : 'series'), year].filter(Boolean).join(' · ')}
      </p>
      {note && <p className='truncate text-xs text-tertiary italic'>{note}</p>}
    </div>
  );
};
