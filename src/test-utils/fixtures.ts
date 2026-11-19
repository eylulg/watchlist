/** Raw TMDB shaped fixtures, as the API returns them. */

export const movie = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Movie ${String(id)}`,
  overview: `Overview of movie ${String(id)}`,
  poster_path: `/poster-${String(id)}.jpg`,
  backdrop_path: null,
  release_date: '2021-05-01',
  vote_average: 7.5,
  vote_count: 1200,
  genre_ids: [18],
  adult: false,
  original_language: 'en',
  popularity: 10,
  ...overrides,
});

export const series = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Series ${String(id)}`,
  overview: `Overview of series ${String(id)}`,
  poster_path: `/series-${String(id)}.jpg`,
  backdrop_path: null,
  first_air_date: '2019-01-10',
  vote_average: 8.1,
  vote_count: 900,
  genre_ids: [18],
  ...overrides,
});

export const person = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Person ${String(id)}`,
  profile_path: `/person-${String(id)}.jpg`,
  known_for_department: 'Acting',
  known_for: [{ title: 'Movie 1' }, { name: 'Series 11' }],
  ...overrides,
});

export const paged = <T>(
  results: T[],
  { page = 1, total_pages = 1, total_results = results.length } = {},
) => ({
  page,
  results,
  total_pages,
  total_results,
});

const castAndCrew = {
  cast: Array.from({ length: 14 }, (_, i) => ({
    id: 100 + i,
    name: `Actor ${String(i + 1)}`,
    character: `Character ${String(i + 1)}`,
    profile_path: i === 1 ? null : `/actor-${String(i + 1)}.jpg`,
    // Deliberately out of order: the app must sort by billing order.
    order: 13 - i,
  })),
  crew: [
    {
      id: 200,
      name: 'Pat Producer',
      job: 'Producer',
      department: 'Production',
      profile_path: null,
    },
    {
      id: 201,
      name: 'Dana Director',
      job: 'Director',
      department: 'Directing',
      profile_path: null,
    },
    {
      id: 201,
      name: 'Dana Director',
      job: 'Screenplay',
      department: 'Writing',
      profile_path: null,
    },
    { id: 202, name: 'Grip Person', job: 'Key Grip', department: 'Crew', profile_path: null },
    {
      id: 203,
      name: 'Cam Composer',
      job: 'Original Music Composer',
      department: 'Sound',
      profile_path: null,
    },
  ],
};

const videos = {
  results: [
    { key: 'clip1', name: 'A clip', site: 'YouTube', type: 'Clip', official: true },
    { key: 'vimeo1', name: 'Vimeo trailer', site: 'Vimeo', type: 'Trailer', official: false },
    { key: 'trailer1', name: 'Official trailer', site: 'YouTube', type: 'Trailer', official: true },
    { key: 'other', name: 'Elsewhere', site: 'Dailymotion', type: 'Trailer' },
  ],
};

const watchProviders = {
  results: {
    US: {
      link: 'https://www.themoviedb.org/movie/42/watch?locale=US',
      flatrate: [
        { provider_id: 2, provider_name: 'Stream Two', logo_path: '/two.png', display_priority: 2 },
        { provider_id: 1, provider_name: 'Stream One', logo_path: '/one.png', display_priority: 1 },
      ],
      rent: [{ provider_id: 3, provider_name: 'Rent Shop', logo_path: null, display_priority: 5 }],
    },
    TR: {
      link: 'https://www.themoviedb.org/movie/42/watch?locale=TR',
      buy: [{ provider_id: 4, provider_name: 'Buy TR', logo_path: null }],
    },
  },
};

export const movieDetail = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...movie(id),
  tagline: 'A tagline',
  runtime: 155,
  genres: [
    { id: 878, name: 'Science Fiction' },
    { id: 12, name: 'Adventure' },
  ],
  belongs_to_collection: { id: 900, name: 'The Movie Collection', poster_path: null },
  credits: castAndCrew,
  videos,
  recommendations: paged([movie(id + 1), movie(id + 2)]),
  'watch/providers': watchProviders,
  ...overrides,
});

export const tvDetail = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...series(id),
  tagline: '',
  episode_run_time: [50],
  number_of_seasons: 2,
  number_of_episodes: 18,
  genres: [{ id: 18, name: 'Drama' }],
  created_by: [{ id: 300, name: 'Cree Ator', profile_path: null }],
  seasons: [
    { season_number: 0, name: 'Specials', episode_count: 1, air_date: '', poster_path: null },
    {
      season_number: 1,
      name: 'Season 1',
      episode_count: 10,
      air_date: '2019-01-10',
      poster_path: '/s1.jpg',
    },
    {
      season_number: 2,
      name: 'Season 2',
      episode_count: 8,
      air_date: '2021-03-01',
      poster_path: null,
    },
  ],
  credits: castAndCrew,
  videos: { results: [] },
  recommendations: paged([series(id + 1)]),
  'watch/providers': { results: {} },
  ...overrides,
});

export const seasonDetail = (seasonNumber: number, overrides: Record<string, unknown> = {}) => ({
  season_number: seasonNumber,
  name: `Season ${String(seasonNumber)}`,
  overview: 'Season overview',
  air_date: '2019-01-10',
  poster_path: null,
  episodes: [
    {
      id: 1001,
      episode_number: 1,
      name: 'Pilot',
      overview: 'It begins.',
      air_date: '2019-01-10',
      runtime: 52,
      still_path: '/e1.jpg',
      vote_average: 8,
    },
    {
      id: 1002,
      episode_number: 2,
      name: 'Second',
      overview: '',
      air_date: '2019-01-17',
      runtime: null,
      still_path: null,
      vote_average: 7.5,
    },
  ],
  ...overrides,
});

export const personDetail = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Person ${String(id)}`,
  biography: 'First paragraph.\n\nSecond paragraph.',
  birthday: '1980-02-03',
  deathday: null,
  place_of_birth: 'Amsterdam, Netherlands',
  known_for_department: 'Acting',
  profile_path: '/p.jpg',
  combined_credits: {
    cast: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Old Film',
        release_date: '2001-04-01',
        character: 'Lead',
        poster_path: null,
      },
      {
        id: 2,
        media_type: 'tv',
        name: 'A Show',
        first_air_date: '2015-09-09',
        character: 'Host',
        poster_path: null,
      },
      {
        id: 3,
        media_type: 'movie',
        title: 'Upcoming Film',
        release_date: '',
        character: 'Hero',
        poster_path: null,
      },
      {
        id: 4,
        media_type: 'movie',
        title: 'Same Year',
        release_date: '2015-01-01',
        character: 'Villain',
        poster_path: null,
      },
    ],
    crew: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Old Film',
        release_date: '2001-04-01',
        job: 'Producer',
        poster_path: null,
      },
      { id: 9, media_type: 'person', name: 'not a title' },
    ],
  },
  ...overrides,
});

export const collectionDetail = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: 'The Movie Collection',
  overview: 'Every film in the series.',
  poster_path: null,
  backdrop_path: null,
  parts: [
    movie(3, { release_date: '2010-01-01' }),
    movie(4, { release_date: '' }),
    movie(2, { release_date: '2005-01-01' }),
  ],
  ...overrides,
});
