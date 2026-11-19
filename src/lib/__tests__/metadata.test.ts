import { describe, expect, it } from 'vitest';
import { localeAlternates } from '../metadata';

describe('localeAlternates', () => {
  it('points a title page at itself in every locale, not at the home page', () => {
    expect(localeAlternates('tr', '/movie/438631')).toEqual({
      canonical: '/tr/movie/438631',
      languages: {
        en: '/en/movie/438631',
        tr: '/tr/movie/438631',
        de: '/de/movie/438631',
        'x-default': '/en/movie/438631',
      },
    });
  });
});
