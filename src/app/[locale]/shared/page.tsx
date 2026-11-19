import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QueryProvider } from '@/components/app/query-provider';
import { SharedView } from '@/components/shared/shared-view';
import { resolveLocale } from '@/lib/route-params';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: resolveLocale((await params).locale),
    namespace: 'Shared',
  });
  // Shared lists are personal; keep them out of search engines.
  return { title: t('defaultTitle'), robots: { index: false, follow: false } };
}

export default async function SharedPage({ params }: PageProps) {
  resolveLocale((await params).locale);
  return (
    <QueryProvider>
      <SharedView />
    </QueryProvider>
  );
}
