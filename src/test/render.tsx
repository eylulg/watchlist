import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router";
import { configureAxe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";

export const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });

/** Renders the real route table at `path`, with real providers and msw standing in for TMDB. */
export const renderApp = (path = "/") => {
    const router = createMemoryRouter(routes, { initialEntries: [path] });
    const queryClient = createTestQueryClient();
    const user = userEvent.setup();
    const utils = render(
        <AppProviders queryClient={queryClient}>
            <RouterProvider router={router} />
        </AppProviders>,
    );
    return { ...utils, router, user, queryClient };
};

/** Waits for the lazy route to load and its main heading to render. */
export const findPageHeading = (name: string | RegExp) => screen.findByRole("heading", { level: 1, name });

/** jsdom cannot compute colors, so contrast is checked in the browser instead. */
export const axe = configureAxe({ rules: { "color-contrast": { enabled: false } } });
