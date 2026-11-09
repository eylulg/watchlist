import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe, findPageHeading, renderApp } from "@/test/render";
import { requestsTo } from "@/test/server";

describe("Home page", () => {
    it("shows trending movies and series rows and has no axe violations", async () => {
        const { container } = renderApp("/");
        await findPageHeading("Streaming catalogue");

        const movies = await screen.findByRole("list", { name: "Trending movies" });
        const shows = await screen.findByRole("list", { name: "Trending series" });
        expect(within(movies).getAllByRole("article")).toHaveLength(3);
        expect(within(shows).getAllByRole("article")).toHaveLength(2);

        expect(await axe(container)).toHaveNoViolations();
    });

    it("switches the trending window with the tabs", async () => {
        const { user } = renderApp("/");
        await screen.findByRole("list", { name: "Trending movies" });
        expect(requestsTo("/trending/movie/week")).toHaveLength(1);

        await user.click(screen.getByRole("tab", { name: "Today" }));
        await waitFor(() => {
            expect(requestsTo("/trending/movie/day")).toHaveLength(1);
        });
        expect(screen.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
    });

    it("cards are keyboard reachable links", async () => {
        const { user } = renderApp("/");
        await screen.findByRole("list", { name: "Trending movies" });

        const firstCardLink = screen.getByRole("link", { name: /Movie 1/ });
        firstCardLink.focus();
        await user.keyboard("{Enter}");
        expect(await findPageHeading(/Movie 1/)).toBeInTheDocument();
    });
});
