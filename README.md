# Watchlist

A personal movie and series watchlist on top of [The Movie Database (TMDB)](https://www.themoviedb.org/). You browse and search the catalogue, then keep your own list with a status (to watch, watching, watched), a rating and a note for each title. English, Turkish and German.

Live: https://eg-watchlist.vercel.app

The catalogue comes from TMDB through my own API key, which stays on the server. Your list is not stored on any server. It lives in your browser's `localStorage`.

## Run it

Needs Node 24 and a free TMDB API key from https://www.themoviedb.org/settings/api (a v3 key, or a v4 read access token that starts with `eyJ`). The app depends on the component library as `file:../ui`, so clone [`eylulg/ui`](https://github.com/eylulg/ui) next to this folder and build it once (`npm install && npm run build` inside it).

```bash
npm install && npm run relink   # run relink again after rebuilding the library
cp .env.example .env            # set TMDB_API_KEY
npm run dev
```

Open http://localhost:3000. Other commands: `npm test`, `npm run e2e`, `npm run check:bundle`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run knip`.

## Decisions

- **The TMDB key never reaches the browser.** It is read in `src/lib/tmdb/client.ts`, which imports `server-only`, so a client import fails the build. ESLint blocks `NEXT_PUBLIC_` TMDB variables. After a build, `npm run check:bundle` scans `.next/static` for the key, the variable name and direct TMDB URLs, and CI fails if it finds any. The cost is that search goes through my own `/api/search` route, which has a rate limit (60 a minute per client, in memory per server instance) and refuses cross site requests.
- **Everything from outside is validated with zod.** TMDB responses, `localStorage`, imported files, share links and URL parameters. One malformed item in a TMDB list is dropped and does not fail the page.
- **The list stays in the browser.** Export and import use a JSON file. A share link holds the list (titles, status and rating, not notes) compressed with lz-string in the URL fragment, which browsers never send to a server. The cost is that a list does not follow you between devices without an export.
- **TMDB responses are cached by Next.** 1 hour for trending, 6 hours for popular and top rated, 10 minutes for search, 12 hours for details. Pages render per request, so a build never calls TMDB. The cost is data up to 12 hours old on detail pages.
- **A minimal service worker.** It makes the app installable and shows an offline page. It does not cache TMDB data.

Performance work and its numbers are in [docs/performance.md](docs/performance.md).

## Tests

Vitest runs with MSW standing in for TMDB, so the API layer and the search route use their real code. It covers the watchlist store (corrupt and blocked storage, sync between tabs), share links, import and export, filters, statistics and translation parity. Playwright runs the production build against a small TMDB stand-in (`e2e/mock-tmdb`): search, add a title, change its status, open a shared link in a fresh browser, axe checks in light and dark mode, and no sideways scrolling at 375 px.

## Deploy

Vercel, Next.js preset, repository root. `vercel.json` clones and builds `eylulg/ui` from its main branch during install, so the app uses the latest library code before it is released to npm.

1. Import the repository in Vercel.
2. Add the environment variables below.
3. Deploy. Without `TMDB_API_KEY` the app builds and serves, but pages that need TMDB show an error.

| Variable            | Required | Purpose                                                                       |
| ------------------- | -------- | ----------------------------------------------------------------------------- |
| `TMDB_API_KEY`      | yes      | Server side only. Never prefix it with `NEXT_PUBLIC_`.                        |
| `SITE_URL`          | no       | Public origin for canonical and hreflang links, for example the Vercel URL.   |
| `TMDB_API_BASE_URL` | no       | Another TMDB compatible API. The end to end tests use it for the mock server. |

## Credits

<a href="https://www.themoviedb.org/"><img src="public/tmdb-logo.svg" alt="TMDB logo" width="120" /></a>

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie, series and people data and images are provided by [The Movie Database](https://www.themoviedb.org/). Where to watch data is provided by [JustWatch](https://www.justwatch.com/) through TMDB.

[MIT](LICENSE), Eylül Güneş
