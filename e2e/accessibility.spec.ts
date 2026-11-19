import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/en', ready: 'Trending this week' },
  { name: 'search results', path: '/en/search?q=dune', ready: 'Dune' },
  { name: 'movie', path: '/en/movie/1', ready: 'Dune' },
  { name: 'series', path: '/en/tv/11', ready: 'Severance' },
  { name: 'season', path: '/en/tv/11/season/1', ready: 'Season 1' },
  { name: 'person', path: '/en/person/52', ready: 'Timothée Chalamet' },
  { name: 'collection', path: '/en/collection/900', ready: 'Dune Collection' },
  { name: 'watchlist', path: '/en/watchlist', ready: 'My watchlist' },
  { name: 'settings', path: '/de/settings', ready: 'Einstellungen' },
  { name: 'not found', path: '/tr/nothing-here', ready: 'Sayfa bulunamadı' },
];

/** Seeds one saved title so the watchlist page shows its full layout. */
const seedWatchlist = async (page: Page) => {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const item = {
      id: 1,
      mediaType: 'movie',
      title: 'Dune',
      posterPath: null,
      releaseDate: '2021-09-15',
      status: 'watching',
      rating: 8,
      note: '',
      addedAt: now,
      updatedAt: now,
      runtime: 155,
    };
    window.localStorage.setItem('watchlist:v1', JSON.stringify({ version: 1, items: [item] }));
  });
};

for (const theme of ['light', 'dark'] as const) {
  for (const { name, path, ready } of PAGES) {
    test(`${name} has no axe violations in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await seedWatchlist(page);

      await page.goto(path);
      await expect(
        page
          .getByRole('heading', { level: 1, name: ready })
          .or(page.getByRole('heading', { name: ready }).first()),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([]);
    });
  }
}

test('no page scrolls sideways at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await seedWatchlist(page);
  const overflowing: string[] = [];

  for (const { path, ready } of PAGES) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: ready }).first()).toBeVisible();
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    if (!fits) overflowing.push(path);
  }

  expect(overflowing).toEqual([]);
});
