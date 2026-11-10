"use client";

import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { SearchRequestError } from "@/components/search/search-api";

declare module "react-aria-components" {
    interface RouterConfig {
        routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
    }
}

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

export const Providers = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [queryClient] = useState(createQueryClient);

    function handleNavigate(href: string, options?: Parameters<typeof router.push>[1]) {
        router.push(href, options);
    }

    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider navigate={handleNavigate}>{children}</RouterProvider>
        </QueryClientProvider>
    );
};
