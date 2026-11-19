'use client';

import { ProjectSwitcher, ThemeToggle, TopNav } from '@eylulg/ui/chrome';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useWatchlist } from '@/lib/watchlist/store';

const NAV_ITEMS = [
  { href: '/', key: 'home', exact: true },
  { href: '/search', key: 'search', exact: false },
  { href: '/watchlist', key: 'watchlist', exact: false },
  { href: '/settings', key: 'settings', exact: false },
] as const;

/** A client component because the locale aware Link is a function, which a server component cannot pass down. */
export const Nav = () => {
  const t = useTranslations('Nav');
  const tt = useTranslations('Theme');
  const tp = useTranslations('Projects');
  const pathname = usePathname();
  const { items } = useWatchlist();
  const saved = items?.length ?? 0;

  const themeLabels = {
    ariaLabel: tt('ariaLabel'),
    light: tt('light'),
    dark: tt('dark'),
    system: tt('system'),
  };
  const projectLabels = {
    label: tp('label'),
    heading: tp('heading'),
    youAreHere: tp('youAreHere'),
    sourceCode: tp('sourceCode'),
  };

  const links = NAV_ITEMS.map((item) => ({
    href: item.href,
    label:
      item.key === 'watchlist' && saved > 0
        ? t('watchlistWithCount', { count: saved })
        : t(item.key),
    isCurrent: item.exact ? pathname === item.href : pathname.startsWith(item.href),
  }));

  return (
    <TopNav
      productName={t('brand')}
      navLabel={t('label')}
      homeHref='/'
      LinkComponent={Link}
      links={links}
      labels={{ openMenu: t('openMenu'), closeMenu: t('closeMenu') }}
      actions={
        <>
          <ProjectSwitcher currentId='watchlist' labels={projectLabels} />
          <ThemeToggle labels={themeLabels} />
        </>
      }
      compactActions={<ThemeToggle compact labels={themeLabels} />}
    />
  );
};
