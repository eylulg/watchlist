import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // The locale is always in the URL, so every page has one canonical, shareable address.
  localePrefix: 'always',
  localeCookie: { name: 'WATCHLIST_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});
