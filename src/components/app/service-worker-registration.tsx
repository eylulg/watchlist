'use client';

import { useEffect } from 'react';

/** Registers the minimal service worker that serves the offline page. Production only, so dev reloads stay predictable. */
export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Not fatal: the app works without it, only the offline page is missing.
    });
  }, []);
  return null;
};
