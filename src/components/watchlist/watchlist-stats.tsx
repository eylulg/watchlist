import { Stat } from '@eylulg/ui/stat';
import { useFormatter, useTranslations } from 'next-intl';
import type { WatchlistStats as Stats } from '@/lib/watchlist/stats';

export const WatchlistStats = ({
  stats,
  headingId = 'stats',
}: {
  stats: Stats;
  headingId?: string;
}) => {
  const t = useTranslations('Stats');
  const format = useFormatter();

  const tiles = [
    {
      label: t('total'),
      value: format.number(stats.total),
      detail: t('split', { movies: stats.movies, series: stats.series }),
    },
    { label: t('toWatch'), value: format.number(stats.byStatus['to-watch']) },
    { label: t('watching'), value: format.number(stats.byStatus.watching) },
    { label: t('watched'), value: format.number(stats.byStatus.watched) },
    {
      label: t('hoursWatched'),
      value: `${stats.isEstimate ? '≈ ' : ''}${format.number(stats.hoursWatched, { maximumFractionDigits: 1 })}`,
      detail: stats.isEstimate ? t('estimate') : undefined,
    },
    {
      label: t('averageRating'),
      value:
        stats.averageRating === null
          ? t('noRating')
          : format.number(stats.averageRating, { maximumFractionDigits: 1 }),
    },
  ];

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <h2 id={headingId} className='sr-only'>
        {t('title')}
      </h2>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
        {tiles.map((tile) => (
          <Stat
            key={tile.label}
            size='sm'
            isCard
            label={tile.label}
            value={tile.value}
            detail={tile.detail}
          />
        ))}
      </div>
    </section>
  );
};
