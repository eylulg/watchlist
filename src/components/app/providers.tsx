'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RouterProvider } from 'react-aria-components';

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
  }
}

export const Providers = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  function handleNavigate(href: string, options?: Parameters<typeof router.push>[1]) {
    router.push(href, options);
  }

  return <RouterProvider navigate={handleNavigate}>{children}</RouterProvider>;
};
