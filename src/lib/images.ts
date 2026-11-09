import { TMDB_IMAGE_BASE } from "@/api/tmdb";

const POSTER_WIDTHS = [154, 185, 342, 500, 780] as const;
const PROFILE_WIDTHS = [45, 185] as const; // TMDB profile sizes: w45, w185, h632
const BACKDROP_WIDTHS = [300, 780, 1280] as const;

export interface ImageSources {
    src: string;
    srcSet: string;
}

const build = (path: string, widths: readonly number[], fallbackWidth: number): ImageSources => ({
    src: `${TMDB_IMAGE_BASE}/w${fallbackWidth}${path}`,
    srcSet: widths.map((w) => `${TMDB_IMAGE_BASE}/w${w}${path} ${w}w`).join(", "),
});

export const posterSources = (path: string): ImageSources => build(path, POSTER_WIDTHS, 342);
export const profileSources = (path: string): ImageSources => build(path, PROFILE_WIDTHS, 185);
export const backdropSources = (path: string): ImageSources => build(path, BACKDROP_WIDTHS, 780);

/** `sizes` for posters in the responsive grid: 2 columns on phones up to 6 on wide screens. */
export const GRID_POSTER_SIZES = "(min-width: 1280px) 200px, (min-width: 1024px) 18vw, (min-width: 640px) 30vw, 46vw";
/** `sizes` for posters in the horizontally scrolling rows on Home. */
export const ROW_POSTER_SIZES = "(min-width: 640px) 180px, 40vw";
