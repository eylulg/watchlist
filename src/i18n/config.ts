export const locales = ['en', 'tr', 'de'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';

export const isLocale = (value: unknown): value is AppLocale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/** TMDB language codes used for content in each UI locale. */
export const tmdbLanguage: Record<AppLocale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
};

/** Native language names, shown in the language picker. */
export const localeNames: Record<AppLocale, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
};

/** Region used for "where to watch" when the user has not picked one. */
export const defaultRegion: Record<AppLocale, string> = {
  en: 'US',
  tr: 'TR',
  de: 'DE',
};
