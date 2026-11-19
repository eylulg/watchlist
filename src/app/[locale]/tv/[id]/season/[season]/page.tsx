import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeasonView } from '@/components/detail/season-view';
import { localeAlternates, metadataOrError } from '@/lib/metadata';
import { parseId, resolveLocale } from '@/lib/route-params';
import { getSeason, getSeries, isNotFound } from '@/lib/tmdb/client';

interface PageProps {
  params: Promise<{ locale: string; id: string; season: string }>;
}

const load = async ({ params }: PageProps) => {
  const { locale: rawLocale, id, season } = await params;
  const locale = resolveLocale(rawLocale);
  // Season 0 holds specials, so it is valid here.
  if (!/^\d{1,3}$/.test(season)) notFound();
  const seriesId = parseId(id);
  try {
    const [series, detail] = await Promise.all([
      getSeries(seriesId, locale),
      getSeason(seriesId, Number(season), locale),
    ]);
    return { series, detail };
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale, id, season } = await props.params;
  return metadataOrError(locale, async () => {
    const { series, detail } = await load(props);
    return {
      title: `${series.title}: ${detail.name}`,
      alternates: localeAlternates(locale, `/tv/${id}/season/${season}`),
    };
  });
}

export default async function SeasonPage(props: PageProps) {
  const { series, detail } = await load(props);
  return <SeasonView season={detail} seriesTitle={series.title} />;
}
