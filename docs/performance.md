# Performance

Measured on the production build (`next build`, `next start -p 4805`), Lighthouse 13 with mobile defaults, a cold browser and an empty cache per run, three runs per route, the median kept. TMDB is the mock in `e2e/mock-tmdb` with full pages of 20 posters (`MOCK_TMDB_POSTERS=1`), so runs repeat. The watchlist route is measured with 80 seeded titles. Raw Lighthouse JSON and `summary.json` are in `docs/perf/before` and `docs/perf/after`; `docs/perf/real` is one run against the real API. Reproduce with `npm run perf:measure -- <label>` while the server and mock are up. Script sizes are gzipped transfer sizes (kB of 1000 bytes) before the load event settles.

## Results

| Route             | Metric          | Before   | After    | Delta    |
| ----------------- | --------------- | -------- | -------- | -------- |
| /en               | JS gzip         | 294.9 kB | 270.8 kB | -24.1 kB |
| /en               | Lighthouse      | 100      | 100      | 0        |
| /en               | TBT             | 5 ms     | 3 ms     | -2 ms    |
| /en               | CLS             | 0        | 0        | 0        |
| /en/search?q=dune | JS gzip         | 322.2 kB | 305.6 kB | -16.6 kB |
| /en/search?q=dune | Lighthouse      | 100      | 100      | 0        |
| /en/movie/1       | JS gzip         | 312.8 kB | 288.7 kB | -24.1 kB |
| /en/movie/1       | Lighthouse      | 100      | 100      | 0        |
| /en/watchlist     | JS gzip         | 340.1 kB | 316.0 kB | -24.1 kB |
| /en/watchlist     | Lighthouse      | 87       | 88       | +1       |
| /en/watchlist     | LCP (simulated) | 4063 ms  | 3904 ms  | -159 ms  |

Infinite scroll on search at 375 px, four appended pages, 400 ms added to each page request (the mock answers in a few milliseconds, the real API does not):

| Scroll                    | CLS before             | CLS after                               |
| ------------------------- | ---------------------- | --------------------------------------- |
| Small steps, like a thumb | 3.303 (0.826 per page) | 0                                       |
| Straight to the bottom    | 3.303 (0.826 per page) | 1.68 (0.84 per page, two pages reached) |

One run against the real API (movie 438631): home 95, search 87, movie 100, CLS 0 on all three. Home asks for 64 poster images on a 1280 px screen, all at the 256 px candidate, and only the first poster is preloaded.

## What each change did

- Watchlist validation moved to `zod/mini` (client side only; the server keeps full zod). The client had carried the whole classic zod build on every route. About 24 kB gzip off every route.
- TanStack Query now loads with the search and shared list routes only, through `QueryProvider`. Home, movie and watchlist no longer ship it. Counted inside the 24 kB above for those routes; search keeps it.
- Search reserves one page of placeholder cards after the results, with the same footprint as a card. The next page replaces them instead of pushing the footer down, and a new key per page makes the browser see replacement and not movement. The first placeholder starts loading 600 px before it reaches the screen; the end of the list is watched too.
- Home preloads one poster, not three. Everything else is native lazy.
- The Inter latin file is preloaded with the hashed URL the stylesheet uses.
- `lighthouserc.json` and a `performance` job in `ci.yml`: score 0.9, CLS 0.1 and a 330 kB script budget on home, search and a movie page. The budget sits above the current numbers on purpose; see below.

## What did not help

- Loading the project menu on demand. The theme toggle in the same top bar pulls in the same menu and popover code, so the chunk stayed in the first load. Reverted.
- Loading the share panel and import and export on demand. The import paragraph is the largest text on the watchlist, so moving it later made the lab LCP the same and added requests. Reverted.
- Splitting the virtualiser further. It is already only on the watchlist route and weighs about 3 kB gzip.

## What is left

- The 200 kB landing budget is not met. React DOM and the Next client are about 125 kB of the 271 kB. The rest is mostly React Aria (buttons, links, menus and popovers) and `tailwind-merge` through `@eylulg/ui`, which this repo cannot change. A menu that loads its popover on first open, in the library, is the change that would move this the most.
- The watchlist scores 88 on the mobile simulation. Its largest text only exists after hydration, so the simulated LCP follows the 316 kB of script. The observed LCP in the same run is 104 ms.
- Jumping straight to the bottom of a long result list still shifts the footer, because it sits in view while a page of content is added above it. Keyboard End within half a second of the press is excluded from CLS by the browser.
- `latin-ext` Inter is fetched on every page because the footer credit contains two Turkish letters. That is the library footer.
