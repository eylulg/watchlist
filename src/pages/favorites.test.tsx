import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAVORITES_STORAGE_KEY } from "@/lib/favorites-storage";
import { axe, findPageHeading, renderApp } from "@/test/render";

const stored = () => JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]") as { id: number; mediaType: string }[];

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Favorites", () => {
    it("shows an empty state with no axe violations", async () => {
        const { container } = renderApp("/favorites");
        expect(await screen.findByRole("heading", { name: "No favorites yet" })).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    it("persists a favorite to localStorage and restores it after a reload", async () => {
        const first = renderApp("/");
        await screen.findByRole("list", { name: "Trending movies" });

        const toggle = screen.getByRole("button", { name: "Add Movie 2 to favorites" });
        await first.user.click(toggle);
        expect(screen.getByRole("button", { name: "Remove Movie 2 from favorites" })).toHaveAttribute("aria-pressed", "true");
        expect(stored()).toMatchObject([{ id: 2, mediaType: "movie" }]);

        // A fresh app instance reads the same storage.
        first.unmount();
        const second = renderApp("/favorites");
        await findPageHeading("Favorites");
        const list = await screen.findByRole("list", { name: "All favorites" });
        expect(within(list).getByRole("link", { name: /Movie 2/ })).toBeInTheDocument();
        expect(await axe(second.container)).toHaveNoViolations();

        await second.user.click(screen.getByRole("button", { name: "Remove Movie 2 from favorites" }));
        expect(stored()).toEqual([]);
        expect(await screen.findByRole("heading", { name: "No favorites yet" })).toBeInTheDocument();
    });

    it("adds from the detail page and filters by type", async () => {
        const { user } = renderApp("/movie/42");
        await user.click(await screen.findByRole("button", { name: "Add to favorites" }));
        expect(screen.getByRole("button", { name: "In favorites" })).toHaveAttribute("aria-pressed", "true");
        expect(stored()).toMatchObject([{ id: 42, mediaType: "movie" }]);

        await user.click(screen.getByRole("link", { name: "Favorites" }));
        await user.click(await screen.findByRole("tab", { name: /Series/ }));
        expect(await screen.findByRole("heading", { name: "No series saved" })).toBeInTheDocument();
    });

    it("ignores corrupt stored data", async () => {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, "{not json");
        renderApp("/favorites");
        expect(await screen.findByRole("heading", { name: "No favorites yet" })).toBeInTheDocument();
    });

    it("keeps working when storage throws, and says favorites will not be kept", async () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new DOMException("denied", "SecurityError");
        });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("full", "QuotaExceededError");
        });

        const { user } = renderApp("/");
        await screen.findByRole("list", { name: "Trending movies" });
        await user.click(screen.getByRole("button", { name: "Add Movie 1 to favorites" }));
        await user.click(screen.getByRole("link", { name: "Favorites" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("favorites will be lost");
        expect(within(screen.getByRole("list", { name: "All favorites" })).getByRole("link", { name: /Movie 1/ })).toBeInTheDocument();
    });
});
