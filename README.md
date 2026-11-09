# Streaming catalogue

A fast, accessible browser for movies and TV series, powered by [The Movie Database (TMDB)](https://www.themoviedb.org/).

<!-- Screenshot placeholder: add docs/screenshot.png (home page, 1280px wide) and replace this comment with:
![Streaming catalogue home page showing trending movies and series](docs/screenshot.png) -->

> Screenshot coming soon.

**Live demo:** https://eylulg.github.io/movies-series-website-demo/ (after GitHub Pages is enabled)

## What it does

- **Home:** trending movies and series rows, switchable between this week and today.
- **Movies and Series:** search with a 300 ms debounce, sort by rating, release date or title, filter by genre and release year, and paginate. Filters live in the URL, so any view can be bookmarked or shared.
- **Title details:** poster, overview, genres, rating, runtime (or episode length and seasons), and the top 6 cast members, with fallbacks for missing posters, photos, overviews and cast.
- **Favorites:** saved in `localStorage` on your device. Works even when storage is blocked (you get a notice that favorites will not be kept).
- **States everywhere:** loading skeletons, error states with a retry button, empty states, and a 404 page.
- **Light and dark mode** with a toggle (follows the system setting until you choose).
- **Accessible:** keyboard navigable cards with visible focus, a skip link, live result counts for screen readers, alt text, and a layout that works from 375 px wide with no horizontal scrolling.

## Stack

| Area      | Choice                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Build     | Vite 7, TypeScript (strict)                                                                                                  |
| UI        | React 19, [Untitled UI React](https://www.untitledui.com/react) (free MIT components), Tailwind CSS 4, React Aria Components |
| Routing   | React Router 7 data router with lazy, code split routes                                                                      |
| Data      | TanStack Query 5, native `fetch`, zod validation of every TMDB response                                                      |
| Testing   | Vitest, Testing Library, Mock Service Worker, vitest-axe                                                                     |
| Tooling   | ESLint 9 flat config (typescript-eslint strict, jsx-a11y, react-hooks), Prettier                                             |
| CI and CD | GitHub Actions: checks on every push and PR, deploy to GitHub Pages from `master`                                            |

## Run it locally

You need Node 22 or newer (Node 24 recommended, see `.nvmrc`) and a free TMDB API key.

1. Create a TMDB account and request an API key at <https://www.themoviedb.org/settings/api>.
2. Install and configure:

   ```bash
   npm install
   cp .env.example .env
   # then edit .env and set VITE_TMDB_API_KEY=<your key>
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (it ends in `/movies-series-website-demo/`).

### API key or read access token

`VITE_TMDB_API_KEY` accepts either credential from your TMDB settings page:

- **API key (v3), preferred:** 32 characters. Sent as the `api_key` query parameter.
- **API Read Access Token (v4):** a long token starting with `eyJ`. Detected automatically and sent as an `Authorization: Bearer <token>` header instead.

`.env` is gitignored. Never commit a real key.

### A note on client side keys

This is a static site, so Vite inlines the key into the JavaScript bundle at build time. **Anyone visiting the deployed site can read it.** Only use a free TMDB key that has read only access to public data, never one tied to anything sensitive, and rotate it if it is abused.

### Scripts

| Command              | What it does                                         |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the dev server                                 |
| `npm run build`      | Typecheck and build to `dist/` (includes `404.html`) |
| `npm run preview`    | Serve the production build locally                   |
| `npm run typecheck`  | Run the TypeScript compiler                          |
| `npm run lint`       | Run ESLint                                           |
| `npm run format`     | Format with Prettier                                 |
| `npm test`           | Run the test suite once                              |
| `npm run test:watch` | Run tests in watch mode                              |

## What is tested

Tests run against the real route table and providers, with [MSW](https://mswjs.io/) standing in for TMDB, so no network or key is needed.

- **API layer** (`src/api/tmdb.test.ts`): parsing and normalising movies and series, defaults for missing fields and null posters, the 500 page cap, schema mismatches, TMDB error messages with status codes, network failures, a missing key, v3 key as query parameter versus v4 token as Bearer header, cast sorted by billing order and capped at 6, and client side sorting.
- **Search debounce:** a hook test with fake timers, plus a page test proving that typing "dune" sends exactly one search request, after typing stops.
- **Sort, genre, year and pagination:** the right TMDB parameters are sent and the choice is kept in the URL; search results are sorted on the client because TMDB search cannot sort.
- **Favorites persistence:** saving from a card or the detail page, restoring after a fresh app mount, removing, corrupt storage, and storage that throws.
- **Error and empty states:** error messages, retry that recovers, empty results with "Clear filters", unknown title ids, and the 404 page.
- **Accessibility:** an axe scan of every page (Home, Movies, Series, Title detail, Favorites, 404) in both normal and error or empty states. Color contrast cannot be computed in jsdom, so it was checked in a real browser instead.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `master`:

- Vite uses `base: '/movies-series-website-demo/'` and the router uses the same base path.
- The build copies `index.html` to `404.html`, so deep links such as `/movie/27205` work on Pages.
- The key comes from the repository secret `TMDB_API_KEY`, exposed to the build as `VITE_TMDB_API_KEY`.

To set it up: add the `TMDB_API_KEY` secret under **Settings > Secrets and variables > Actions**, then set **Settings > Pages > Source** to **GitHub Actions**.

## Project structure

```text
src/
  api/          TMDB client (fetch + zod) and TanStack Query options
  app/          router, layout, providers
  components/
    catalogue/  app components (cards, grids, states, theme toggle)
    base/, application/, foundations/, shared-assets/   Untitled UI React components (MIT)
  features/     the shared Movies and Series browse page
  hooks/        debounce, document title
  lib/          favorites, image URLs, paths
  pages/        route components and their tests
  test/         test setup, MSW handlers, fixtures
```

## Credits

<a href="https://www.themoviedb.org/"><img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB logo" width="120" /></a>

This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and series data and images are provided by [The Movie Database](https://www.themoviedb.org/).

UI components from [Untitled UI React](https://github.com/untitleduico/react), used under the MIT license.

## License

[MIT](LICENSE) © Eylül Güneş
