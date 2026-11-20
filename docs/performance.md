# Performance

Production build, Lighthouse 13 with mobile defaults, a cold browser per run, three runs per route, median kept. TMDB is the mock in `e2e/mock-tmdb` with full pages of 20 posters, so runs repeat. The watchlist route has 80 seeded titles. Raw reports are in `docs/perf`, and `npm run perf:measure -- <label>` reproduces them while the server and mock are up.

## Results

| Route             | JS gzip before | after    | Lighthouse before | after |
| ----------------- | -------------- | -------- | ----------------- | ----- |
| /en               | 294.9 kB       | 270.8 kB | 100               | 100   |
| /en/search?q=dune | 322.2 kB       | 305.6 kB | 100               | 100   |
| /en/movie/1       | 312.8 kB       | 288.7 kB | 100               | 100   |
| /en/watchlist     | 340.1 kB       | 316.0 kB | 87                | 88    |

One run against the real API: home 95, search 87, movie 100, CLS 0 on all three.

Infinite scroll on search at 375 px, with 400 ms added to each page request: CLS was 3.3 before. Now it is 0 when scrolling in small steps, and 1.68 when jumping straight to the bottom.

## What changed

- Watchlist validation on the client moved to `zod/mini`. The client had carried the whole classic zod build on every route. About 24 kB gzip off every route.
- TanStack Query loads only with the search and shared list routes.
- Search reserves one page of placeholder cards after the results, so the next page replaces them and the footer does not move.
- Home preloads one poster, not three.
- `lighthouserc.json` and a `performance` job in CI assert a score of 0.9, CLS under 0.1 and a 330 kB script budget on home, search and a movie page.

## What did not help

- Loading the project menu on demand. The theme toggle pulls in the same menu code. Reverted.
- Loading the share panel and import and export on demand. The lab LCP stayed the same and requests increased. Reverted.

## What is left

- The 200 kB target is not met. React DOM and the Next client are about 125 kB of the 271 kB, and most of the rest is React Aria from the component library.
- The watchlist scores 88 on the mobile simulation, because its largest text exists only after hydration. The observed LCP in the same run is 104 ms.
- Jumping straight to the bottom of a long result list still shifts the footer.
