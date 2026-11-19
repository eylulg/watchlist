"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchRequestError } from "@/components/search/search-api";

/** Client errors such as a bad request will not fix themselves, so do not retry them. */
const shouldRetry = (failureCount: number, error: Error) => {
    if (error instanceof SearchRequestError && error.status >= 400 && error.status < 500 && error.status !== 429) return false;
    return failureCount < 2;
};

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { staleTime: 5 * 60 * 1000, retry: shouldRetry, refetchOnWindowFocus: false },
        },
    });

/** Only the search and shared list routes fetch in the browser, so only they load TanStack Query. */
export const QueryProvider = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(createQueryClient);
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
