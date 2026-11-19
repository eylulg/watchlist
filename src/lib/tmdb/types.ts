/**
 * Normalised TMDB shapes used across the app. This module has no runtime dependencies on the
 * server, so client components can import it freely.
 */

export type MediaType = 'movie' | 'tv';

/** A movie or series as shown on a card. Movies and series share one shape inside the app. */
export interface TitleSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  rating: number;
  voteCount: number;
}

export interface PersonSummary {
  id: number;
  mediaType: 'person';
  name: string;
  profilePath: string | null;
  knownForDepartment: string;
  knownFor: string[];
}

export type SearchResult = TitleSummary | PersonSummary;

export const SEARCH_KINDS = ['multi', 'movie', 'tv', 'person'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface Paged<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}

interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  jobs: string[];
  profilePath: string | null;
}

export interface Video {
  key: string;
  name: string;
  site: 'YouTube' | 'Vimeo';
  type: string;
  url: string;
  thumbnailUrl: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
}

export type ProviderKind = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy';

export interface RegionProviders {
  /** TMDB page for this title and region. Links out to JustWatch powered offers. */
  link: string | null;
  flatrate: WatchProvider[];
  free: WatchProvider[];
  ads: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

interface TitleDetailBase extends TitleSummary {
  tagline: string;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
  recommendations: TitleSummary[];
  /** Watch providers keyed by ISO 3166-1 region code. */
  providers: Record<string, RegionProviders>;
}

export interface MovieDetail extends TitleDetailBase {
  mediaType: 'movie';
  /** Film length in minutes. */
  runtime: number | null;
  collection: { id: number; name: string } | null;
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string;
  posterPath: string | null;
}

export interface SeriesDetail extends TitleDetailBase {
  mediaType: 'tv';
  /** Typical episode length in minutes. */
  episodeRuntime: number | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  seasons: SeasonSummary[];
}

export type TitleDetail = MovieDetail | SeriesDetail;

interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string;
  runtime: number | null;
  stillPath: string | null;
  rating: number;
}

export interface SeasonDetail {
  seriesId: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate: string;
  posterPath: string | null;
  episodes: Episode[];
}

export interface FilmographyCredit {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  releaseDate: string;
  /** Characters played and jobs done on this title, merged. */
  roles: string[];
}

export interface FilmographyYear {
  /** Four digit year, or null for undated (usually upcoming) titles. */
  year: number | null;
  credits: FilmographyCredit[];
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string;
  deathday: string;
  placeOfBirth: string;
  knownForDepartment: string;
  profilePath: string | null;
  filmography: FilmographyYear[];
}

export interface CollectionDetail {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  parts: TitleSummary[];
}

export const releaseYear = (date: string): string => (/^\d{4}/.test(date) ? date.slice(0, 4) : '');

export const titleHref = (title: Pick<TitleSummary, 'mediaType' | 'id'>) =>
  `/${title.mediaType}/${String(title.id)}`;
export const personHref = (id: number) => `/person/${String(id)}`;
export const collectionHref = (id: number) => `/collection/${String(id)}`;
export const seasonHref = (seriesId: number, seasonNumber: number) =>
  `/tv/${String(seriesId)}/season/${String(seasonNumber)}`;
