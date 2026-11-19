import { act, screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { router, setUrl } from '@/test-utils/navigation';
import { axe, renderWithProviders } from '@/test-utils/render';
import { api, requestsTo, server } from '@/test-utils/server';
import { SearchView } from '../search-view';

const renderSearch = (url = '/en/search') => renderWithProviders(<SearchView />, { url });

describe('SearchView', () => {
  it('searches once the user stops typing and keeps the query in the URL', async () => {
    const { user } = renderSearch();

    await user.type(screen.getByRole('searchbox', { name: 'Search TMDB' }), 'dune');

    expect(await screen.findByRole('heading', { name: 'dune part one' })).toBeInTheDocument();
    expect(requestsTo('/api/search')).toHaveLength(1);
    expect(router.replace).toHaveBeenLastCalledWith('/en/search?q=dune', { scroll: false });
  });

  it('announces how many results there are', async () => {
    renderSearch('/en/search?q=dune');

    expect(await screen.findByText('55 results for “dune”, showing 3.')).toHaveRole('status');
  });

  it('shows movies, series and people in one list', async () => {
    renderSearch('/en/search?q=dune');

    const results = await screen.findByRole('region', { name: 'Search results' });

    expect(within(results).getAllByRole('listitem')).toHaveLength(3);
    expect(within(results).getByRole('link', { name: /Person 52/ })).toHaveAttribute(
      'href',
      '/en/person/52',
    );
  });

  it('narrows the search to people and keeps that in the URL', async () => {
    const { user } = renderSearch('/en/search?q=dune');
    await screen.findByRole('heading', { name: 'dune part one' });

    await user.click(screen.getByRole('row', { name: 'People' }));

    expect(await screen.findByRole('heading', { name: 'Person 52' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'dune part one' })).not.toBeInTheDocument();
    expect(router.replace).toHaveBeenLastCalledWith('/en/search?q=dune&type=person', {
      scroll: false,
    });
  });

  it('loads the next page with Load more', async () => {
    const { user } = renderSearch('/en/search?q=dune');

    await user.click(await screen.findByRole('button', { name: 'Load more' }));

    await screen.findByRole('button', { name: 'Load more' });
    expect(requestsTo('/api/search').map((url) => url.searchParams.get('page'))).toEqual([
      '1',
      '2',
    ]);
  });

  it('puts the query from the URL back in the field on back navigation', () => {
    renderSearch('/en/search?q=dune');

    act(() => {
      setUrl('/en/search?q=arrival');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByRole('searchbox', { name: 'Search TMDB' })).toHaveValue('arrival');
  });

  it.each([
    ['a prompt before anything is typed', '/en/search', () => undefined, 'Start typing to search'],
    [
      'an empty state when nothing matches',
      '/en/search?q=zzz&type=tv',
      () => undefined,
      'Nothing found',
    ],
    [
      'an error with a retry button when TMDB fails',
      '/en/search?q=dune',
      () => {
        server.use(http.get(api('/search/multi'), () => HttpResponse.json({}, { status: 500 })));
      },
      'Search is not available',
    ],
  ])('shows %s', async (_, url, arrange, heading) => {
    arrange();

    renderSearch(url);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('tells the user a too long query is invalid instead of reporting an outage', async () => {
    renderSearch(`/en/search?q=${'a'.repeat(250)}`);

    expect(
      await screen.findByRole('heading', { name: 'That search is not valid' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Search is not available' }),
    ).not.toBeInTheDocument();
  });

  it('has no axe violations with results', async () => {
    const { container } = renderSearch('/en/search?q=dune');
    await screen.findByRole('heading', { name: 'dune part one' });

    expect(await axe(container)).toHaveNoViolations();
  });
});
