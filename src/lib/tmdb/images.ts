const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/**
 * Builds a TMDB image URL. next/image resizes it further, so request a generous source size:
 * `w780` for posters and stills, `w1280` for backdrops, `h632` for profile photos.
 */
export const tmdbImage = (path: string, size: "w92" | "w185" | "w342" | "w500" | "w780" | "w1280" | "h632" | "original" = "w780") =>
    `${TMDB_IMAGE_BASE}/${size}${path}`;

/** `sizes` for posters in the responsive grid: 2 columns on phones up to 6 on wide screens. */
export const GRID_POSTER_SIZES = "(min-width: 1280px) 200px, (min-width: 1024px) 18vw, (min-width: 640px) 30vw, 46vw";
/** `sizes` for posters in horizontally scrolling rows. */
export const ROW_POSTER_SIZES = "(min-width: 640px) 176px, 40vw";
/** `sizes` for the poster on detail pages. */
export const DETAIL_POSTER_SIZES = "(min-width: 768px) 300px, 60vw";
