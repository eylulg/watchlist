import type { ReactNode } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FavoritesProvider } from "@/lib/favorites";
import { ThemeProvider } from "@/providers/theme-provider";

export const AppProviders = ({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
        </ThemeProvider>
    </QueryClientProvider>
);
