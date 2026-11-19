import { createElement } from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { resetWatchlistStore } from '@/lib/watchlist/store';
import { navigationMock, router, setUrl } from './navigation';
import { requests, server } from './server';

expect.extend(axeMatchers);

vi.mock('next/navigation', () => navigationMock);

// The real component needs Next's image config and server; the browser behaviour under test is the <img>.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => createElement('img', { src, alt, ...props }),
}));

// jsdom gaps that the UI library and layout rely on.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
window.scrollTo = vi.fn();

// Tests run without Tailwind. The UI library hides some label parts with `hidden`; mirror that so
// accessible names match the browser.
const style = document.createElement('style');
style.textContent = '.hidden { display: none; }';
document.head.append(style);
Element.prototype.scrollIntoView = vi.fn();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  requests.length = 0;
  window.localStorage.clear();
  resetWatchlistStore();
  document.documentElement.classList.remove('dark-mode');
  document.cookie = 'watchlist-region=; max-age=0; path=/';
  setUrl('/en');
  vi.clearAllMocks();
  for (const fn of Object.values(router)) fn.mockClear();
});

afterAll(() => {
  server.close();
});
