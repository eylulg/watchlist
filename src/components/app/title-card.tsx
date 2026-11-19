import { Card, CardHeader } from '@eylulg/ui/card';
import { Skeleton } from '@eylulg/ui/skeleton';
import { useLocale, useTranslations } from 'next-intl';
import { Star } from '@/components/app/icons';
import { getPathname } from '@/i18n/navigation';
import { type TitleSummary, releaseYear, titleHref } from '@/lib/tmdb/types';
import { Poster } from './poster';
import { cardClass } from './styles';
import { WatchlistToggle } from './watchlist-toggle';

interface TitleCardProps {
  title: TitleSummary;
  sizes: string;
  priority?: boolean;
}

export const TitleCard = ({ title, sizes, priority }: TitleCardProps) => {
  const t = useTranslations('Common');
  const locale = useLocale();
  const year = releaseYear(title.releaseDate);
  const facts = [t(title.mediaType === 'movie' ? 'movie' : 'series'), year]
    .filter(Boolean)
    .join(' · ');

  const description = (
    <span className='flex flex-wrap items-center gap-x-1.5 text-xs'>
      <span>{facts}</span>
      {title.voteCount > 0 && (
        <span className='inline-flex items-center gap-0.5'>
          <Star aria-hidden='true' className='size-3 fill-current text-warning-400' />
          <span className='sr-only'>{t('ratedOutOf10', { rating: title.rating.toFixed(1) })}</span>
          <span aria-hidden='true'>{title.rating.toFixed(1)}</span>
        </span>
      )}
    </span>
  );

  return (
    <Card
      href={getPathname({ href: titleHref(title), locale })}
      padding='none'
      className={cardClass}
    >
      {/* The title link names the card, so the poster is decorative here. */}
      <Poster path={title.posterPath} alt='' sizes={sizes} priority={priority} isFlush />
      <CardHeader title={title.title} description={description} className='p-card' />
      <WatchlistToggle
        title={{
          id: title.id,
          mediaType: title.mediaType,
          title: title.title,
          posterPath: title.posterPath,
          releaseDate: title.releaseDate,
        }}
      />
    </Card>
  );
};

/** Same footprint as a TitleCard whose title wraps to two lines, so a page of skeletons and a page of cards are as tall. */
export const TitleCardSkeleton = () => (
  <div className='flex flex-col rounded-xl border border-transparent'>
    <Skeleton shape='rect' className='aspect-2/3 h-auto rounded-xl' />
    <div className='flex h-29 flex-col gap-2 p-card'>
      <Skeleton className='w-4/5' />
      <Skeleton className='h-3 w-1/3' />
    </div>
  </div>
);
