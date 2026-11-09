import { QueryClient, keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
    type BrowseParams,
    type MediaType,
    type TimeWindow,
    TmdbError,
    discoverTitles,
    getGenres,
    getTitleDetail,
    getTrending,
    searchTitles,
} from "./tmdb";

export const trendingQuery = (mediaType: MediaType, timeWindow: TimeWindow) =>
    queryOptions({
        queryKey: ["trending", mediaType, timeWindow],
        queryFn: ({ signal }) => getTrending(mediaType, timeWindow, signal),
    });

export const genresQuery = (mediaType: MediaType) =>
    queryOptions({
        queryKey: ["genres", mediaType],
        queryFn: ({ signal }) => getGenres(mediaType, signal),
        staleTime: Infinity,
    });

export const browseQuery = (params: BrowseParams & { query: string }) =>
    queryOptions({
        queryKey: ["browse", params],
        queryFn: ({ signal }) =>
            params.query
                ? searchTitles({ mediaType: params.mediaType, query: params.query, page: params.page, year: params.year }, signal)
                : discoverTitles(params, signal),
        placeholderData: keepPreviousData,
    });

export const titleDetailQuery = (mediaType: MediaType, id: number) =>
    queryOptions({
        queryKey: ["title", mediaType, id],
        queryFn: ({ signal }) => getTitleDetail(mediaType, id, signal),
    });

/** Client errors such as a bad key (401) or unknown id (404) will not fix themselves, so do not retry them. */
const shouldRetry = (failureCount: number, error: Error) => {
    if (error instanceof TmdbError && error.status !== undefined && error.status >= 400 && error.status < 500 && error.status !== 429) {
        return false;
    }
    return failureCount < 2;
};

export const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                retry: shouldRetry,
                refetchOnWindowFocus: false,
            },
        },
    });
