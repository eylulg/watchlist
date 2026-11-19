import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { unstable_rethrow } from 'next/navigation';
import { defaultLocale, locales } from '@/i18n/config';
import { resolveLocale } from '@/lib/route-params';

/** The canonical address of a page in this locale and its translations, for search engines. */
export const localeAlternates = (
  locale: string,
  path: string,
): NonNullable<Metadata['alternates']> => ({
  canonical: `/${locale}${path}`,
  languages: {
    ...Object.fromEntries(locales.map((code) => [code, `/${code}${path}`])),
    'x-default': `/${defaultLocale}${path}`,
  },
});

/**
 * Builds a page's metadata, and gives the page a real title when TMDB is down. A throwing
 * `generateMetadata` otherwise leaves the error page without one. A 404 still reaches the not found page.
 */
export const metadataOrError = async (
  rawLocale: string,
  build: () => Promise<Metadata>,
): Promise<Metadata> => {
  try {
    return await build();
  } catch (error) {
    unstable_rethrow(error);
    const t = await getTranslations({ locale: resolveLocale(rawLocale), namespace: 'Errors' });
    return { title: t('pageTitle') };
  }
};
