import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { encodeSharedList } from '@/lib/watchlist/share';
import { axe, renderWithProviders } from '@/test-utils/render';
import { storeWatchlist, watchlistItem } from '@/test-utils/watchlist';
import { SharedView } from '../shared-view';

// The link carries ids only; the test TMDB names movie n "Movie n".
const shared = [watchlistItem({ id: 1, status: 'watched', rating: 9 }), watchlistItem({ id: 2 })];

const renderShared = (fragment = encodeSharedList(shared, { name: 'Weekend picks' })) =>
  renderWithProviders(<SharedView />, { url: `/en/shared#${fragment}` });

describe('SharedView', () => {
  it('shows the list from the link, read only', async () => {
    renderShared();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Weekend picks' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Movie 1' })).toBeInTheDocument();
    expect(screen.getByText('9 / 10')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it("shows what a title is called in the viewer's own language by looking the ids up, not from the link", async () => {
    const { container } = renderShared();

    expect(await screen.findByRole('heading', { name: 'Movie 2' })).toBeInTheDocument();
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0);
  });

  it('explains a damaged link', async () => {
    renderShared('garbage');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This link does not work' }),
    ).toBeInTheDocument();
  });

  it('adds only missing titles, fresh, and moves focus to the watchlist link', async () => {
    storeWatchlist([watchlistItem({ id: 1, status: 'to-watch' })]);
    const { user } = renderShared();

    await user.click(await screen.findByRole('button', { name: 'Add 1 title to my watchlist' }));

    expect(screen.getByRole('link', { name: 'Open my watchlist' })).toHaveFocus();
    const items = (
      JSON.parse(window.localStorage.getItem('watchlist:v1') ?? '{}') as {
        items: { id: number; status: string; rating: unknown }[];
      }
    ).items;
    expect(items.map((item) => [item.id, item.status, item.rating])).toEqual([
      [2, 'to-watch', null],
      [1, 'to-watch', null],
    ]);
  });

  it('has no axe violations', async () => {
    const { container } = renderShared();
    await screen.findByRole('heading', { level: 1 });

    expect(await axe(container)).toHaveNoViolations();
  });
});
