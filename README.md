# Watchlist

A personal movie and series watchlist on top of [The Movie Database (TMDB)](https://www.themoviedb.org/). Browse and search the catalogue, then keep your own list: what you want to watch, what you are watching and what you have seen, with your rating and a note for each title.

<!-- Screenshot placeholder: add docs/screenshot.png (home page, 1280px wide) and replace this comment with:
![Watchlist home page with trending and popular rows](docs/screenshot.png) -->

## Features

- **Home:** trending, popular and top rated rows for movies and series, each streamed in with its own skeleton and its own error state.
- **Search:** movies, series and people in one place or one kind at a time. Results arrive 300 ms after you stop typing, the query and kind live in the URL, and more results load as you scroll, with a "Load more" button as a fallback. Result counts are announced to screen readers.
- **Movie and series pages:** overview, cast, key crew, videos (thumbnails that link out to YouTube or Vimeo, nothing embedded), recommendations, and where to watch in your region (stream, free, with ads, rent, buy). Series list their seasons, and each season lists its episodes. Movies link to their collection.
- **People and collections:** biography and a filmography grouped by year; every film in a collection in release order.
- **Watchlist:** status (to watch, watching, watched), personal rating, note and date added. Filter by status and type, sort five ways, all kept in the URL. Statistics show counts, average rating and an estimate of hours watched.
- **Your data stays yours:** the list lives in `localStorage`, validated with zod on every read, and stays in sync across open tabs. Export it as JSON, import it in another browser.
- **Share without a server:** a read only link carries the whole list, compressed with lz-string, in the URL fragment. Fragments are never sent to a server, so nothing is uploaded or stored. The recipient can copy the titles into their own list.
- **Three languages:** English, Turkish and German, with the locale in the URL. TMDB content is requested in the same language and falls back to English where a translation is missing.
- **Settings:** where to watch region and language. The light, dark or system theme is the shared toggle in the top bar, applied with no flash on load.
- **Installable:** web app manifest, generated icons, and an offline page served by a minimal service worker. TMDB data is deliberately not cached offline.
- **Accessible:** landmarks, a skip link, visible focus, keyboard navigable cards and carousels (arrow keys, Home, End), focus moved deliberately when an action replaces the focused control, live regions for result counts, and a layout that works from 375 px wide with no sideways scrolling. axe runs in light and dark mode on every page.

## Architecture

```text
Browser                               Next.js server (Vercel)                      TMDB
-------                               -----------------------                      ----
Server rendered pages  <-- HTML --   Server components  -- fetch + TMDB_API_KEY -->  api.themoviedb.org
Search page (client)   -- /api/search?q= -->  Route handler  -- fetch + TMDB_API_KEY -->
Watchlist (client)     localStorage only, never sent anywhere
Share link             /shared#<lz-string data>, the fragment never reaches the server
```

- **The TMDB key never reaches the browser.** `TMDB_API_KEY` is read with `process.env` in `src/lib/tmdb/client.ts`, which imports `server-only`, so importing it from a client component fails the build. ESLint also blocks client code from importing it and blocks `NEXT_PUBLIC_` TMDB variables. After every build, `npm run check:bundle` scans `.next/static` for the key value, the variable name, `api_key=` and direct TMDB URLs, and CI fails if any appear.
- **Validated at the boundary.** Every TMDB response goes through zod schemas (`src/lib/tmdb/schemas.ts`) and is mapped to small app types (`src/lib/tmdb/types.ts`). A single malformed item in a list is dropped instead of failing the page. Storage, imported files, share links and URL parameters are validated the same way.
- **Caching.** TMDB calls use Next's fetch cache with revalidate times per kind of data: 1 hour for trending, 6 hours for popular and top rated lists, 10 minutes for search, 12 hours for details. Pages render per request, so builds never call TMDB, while the responses themselves are cached.
- **Search route.** `/api/search` validates its parameters with zod, rate limits per client, refuses cross site browser requests, sends no CORS headers, and never forwards TMDB's error text.
- **i18n.** next-intl with the locale as the root segment (`src/app/[locale]`), read through `next/root-params`. Messages live in `src/messages/{en,tr,de}.json`; a test checks that all three have the same keys, ICU arguments and tags.
- **UI.** The shared design system [`@eylulg/ui`](https://github.com/eylulg/ui) on Tailwind CSS 4 and React Aria Components, with its `watchlist` theme variant (rose, warm stone grays, large radius). The app chrome (top bar, project switcher, theme toggle, footer) comes from `@eylulg/ui/chrome`; `src/components/app/nav.tsx` is a small client component because the locale aware `Link` is a function that a server component cannot pass down. Title cards use `Card`, statuses and settings use `Select`, filters use `Tag`, and empty views use `EmptyState`. App components live in `src/components/app`, `detail`, `search`, `watchlist`, `shared` and `settings`.

## Run it locally

You need Node 22 or newer (Node 24 recommended, see `.nvmrc`), a free TMDB API key from <https://www.themoviedb.org/settings/api> and a built checkout of the design system next to this repository, because the app depends on `file:../ui`:

```text
Portfolio/
  ui/                              # github.com/eylulg/ui, run npm install && npm run build once
  watchlist/                       # this app
```

```bash
npm install && npm run relink   # relink repeats the copied install after the library is rebuilt
cp .env.example .env
# set TMDB_API_KEY in .env (a v3 key, or a v4 read access token starting with "eyJ")
npm run dev
```

Open <http://localhost:3000>. `.env` is gitignored; never commit a real key.

## Scripts

| Command                | What it does                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Start the dev server                                                   |
| `npm run build`        | Production build                                                       |
| `npm start`            | Serve the production build                                             |
| `npm run typecheck`    | Generate route types and run TypeScript                                |
| `npm run lint`         | ESLint, zero warnings allowed                                          |
| `npm run format:check` | Prettier                                                               |
| `npm run knip`         | Unused files, exports and dependencies                                 |
| `npm test`             | Vitest unit and component tests                                        |
| `npm run check:bundle` | Fail if anything that could reveal the TMDB key is in the client build |
| `npm run e2e`          | Playwright end to end tests against a mock TMDB                        |

Husky runs lint-staged on every commit. Commit messages are plain sentences in the past tense.

## Tests

- **Unit and component tests (Vitest, Testing Library, vitest-axe, MSW).** MSW stands in for TMDB, so the API layer and the search route run their real code. Covered: request building and credentials, error handling, normalisation and English fallback (`src/lib/tmdb`), the search route's validation and its refusal to leak TMDB errors, the rate limiter, the watchlist store (persistence, corrupt and blocked storage, cross tab sync), share link encoding, statistics, filters, import and export, and i18n parity. Feature tests render the search, watchlist, detail, shared and settings views with real children and assert on what a user sees, including where focus lands after actions that remove the focused control. jsdom cannot compute colours, so contrast is left to Playwright.
- **End to end (Playwright).** `e2e/mock-tmdb/server.ts` is a small TMDB stand-in, and the production build is started with `TMDB_API_BASE_URL` pointing at it. The suite searches for a title, adds it, changes its status, opens a shared link in a fresh browser, runs axe on every page in light and dark mode, and checks that no page scrolls sideways at 375 px.

## Deploy

The app deploys to [Vercel](https://vercel.com/). `@eylulg/ui` is not on npm yet, so `vercel.json` sets an install command that clones the public `eylulg/ui` repository into `ui-src`, builds it, points the dependency at it for that build only and installs the app with `--install-links`. Local development and CI keep using `file:../ui`.

1. Import the repository in Vercel. The framework preset is Next.js, the root is the repository root, and the install command comes from `vercel.json`. The build command is the default (`next build`).
2. Under **Settings > Environment Variables** add `TMDB_API_KEY` (secret, Production and Preview, never prefixed with `NEXT_PUBLIC_`) and `SITE_URL` (the public origin, for example `https://watchlist.vercel.app`).
3. Deploy. Without `TMDB_API_KEY` the app still builds and serves; pages that need TMDB show an error message instead of data.

CI (`.github/workflows/ci.yml`) first checks out `eylulg/ui` into `ui-src`, builds it and points the dependency at it with `npm pkg set` (the composite action in `.github/actions/setup-ui`; the lockfile change is not committed), then runs typecheck, lint, format, knip, tests, build, the client bundle check, Playwright and a gitleaks secret scan on every push to `main` and every pull request.

## Credits

<a href="https://www.themoviedb.org/"><img src="public/tmdb-logo.svg" alt="TMDB logo" width="120" /></a>

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie, series and people data and images are provided by [The Movie Database](https://www.themoviedb.org/).

Where to watch data is provided by [JustWatch](https://www.justwatch.com/) through TMDB, and is credited wherever it is shown.

UI components from [`@eylulg/ui`](https://github.com/eylulg/ui).

## License

[MIT](LICENSE) © Eylül Güneş
