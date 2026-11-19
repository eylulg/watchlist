import { Suspense } from 'react';
import { cx } from '@eylulg/ui/cx';
import { Skeleton } from '@eylulg/ui/skeleton';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QueryProvider } from '@/components/app/query-provider';
import { pageIntroClass, pageTitleClass, stableHeightClass } from '@/components/app/styles';
import { SearchView } from '@/components/search/search-view';
import { resolveLocale } from '@/lib/route-params';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'Search',
  });
  return { title: t('title') };
}

export default async function SearchPage({ params }: PageProps) {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'Search',
  });
  return (
    <div className={cx(stableHeightClass, 'flex flex-col gap-6')}>
      <div className='flex flex-col gap-2'>
        <h1 className={pageTitleClass}>{t('title')}</h1>
        <p className={pageIntroClass}>{t('intro')}</p>
      </div>
      {/* The view reads the query from the URL, which only exists per request, so it renders in the browser. */}
      <Suspense
        fallback={
          <div aria-hidden='true' className='flex flex-col gap-4'>
            <Skeleton shape='rect' className='h-[5.25rem] max-w-xl rounded-lg' />
            <Skeleton shape='rect' className='h-control-sm w-72 rounded-lg' />
          </div>
        }
      >
        <QueryProvider>
          <SearchView />
        </QueryProvider>
      </Suspense>
    </div>
  );
}
