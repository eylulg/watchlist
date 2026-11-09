import type { RouteObject } from "react-router";
import { RootLayout } from "./root-layout";
import { RouteError } from "./route-error";
import { RouteFallback } from "./route-fallback";

/** Route table shared by the browser router and the tests. Every page is code split. */
export const routes: RouteObject[] = [
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <RouteError />,
        hydrateFallbackElement: <RouteFallback />,
        children: [
            {
                errorElement: <RouteError />,
                children: [
                    { index: true, lazy: async () => ({ Component: (await import("@/pages/home")).HomePage }) },
                    { path: "movies", lazy: async () => ({ Component: (await import("@/pages/movies")).MoviesPage }) },
                    { path: "series", lazy: async () => ({ Component: (await import("@/pages/series")).SeriesPage }) },
                    { path: "favorites", lazy: async () => ({ Component: (await import("@/pages/favorites")).FavoritesPage }) },
                    { path: ":mediaType/:id", lazy: async () => ({ Component: (await import("@/pages/title-detail")).TitleDetailPage }) },
                    { path: "*", lazy: async () => ({ Component: (await import("@/pages/not-found")).NotFoundPage }) },
                ],
            },
        ],
    },
];
