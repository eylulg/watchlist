import { act, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { paged } from "@/test/fixtures";
import { axe, findPageHeading, renderApp } from "@/test/render";
import { api, requestsTo, server } from "@/test/server";

const resultCards = async () => within(await screen.findByRole("list", { name: /results/i })).findAllByRole("article");

describe("Movies page", () => {
    it("lists movies with an announced result count and has no axe violations", async () => {
        const { container } = renderApp("/movies");
        await findPageHeading("Movies");

        expect(await resultCards()).toHaveLength(3);
        expect(screen.getByRole("status", { name: "" })).toHaveTextContent("60 movies found.");
        expect(screen.getByRole("status", { name: "" })).toHaveAttribute("aria-live", "polite");
        expect(screen.getByRole("link", { name: /Arrival/ })).toHaveAttribute("href", "/movie/2");

        expect(await axe(container)).toHaveNoViolations();
    });

    it("debounces search: one request after typing stops, none per keystroke", async () => {
        const { user, router } = renderApp("/movies");
        await resultCards();

        await user.type(screen.getByRole("searchbox", { name: /Search movies/ }), "dune");

        // Typing took well under 300ms, so nothing has been sent yet.
        expect(requestsTo("/search/movie")).toHaveLength(0);

        expect(await screen.findByRole("link", { name: /dune part one/ })).toBeInTheDocument();
        const searches = requestsTo("/search/movie");
        expect(searches).toHaveLength(1);
        expect(searches[0]?.searchParams.get("query")).toBe("dune");
        expect(router.state.location.search).toBe("?q=dune");
    });

    it("sorts through the TMDB discover endpoint and keeps the choice in the URL", async () => {
        const { user, router } = renderApp("/movies");
        await resultCards();
        expect(requestsTo("/discover/movie").at(-1)?.searchParams.get("sort_by")).toBe("vote_average.desc");

        await user.click(screen.getByRole("button", { name: /Sort by/ }));
        await user.click(await screen.findByRole("option", { name: "Title A to Z" }));

        await waitFor(() => {
            expect(requestsTo("/discover/movie").at(-1)?.searchParams.get("sort_by")).toBe("title.asc");
        });
        expect(router.state.location.search).toBe("?sort=title");
    });

    it("sorts search results on the client, since TMDB search cannot sort", async () => {
        renderApp("/movies?q=zeta&sort=title");
        const cards = await resultCards();
        expect(cards.map((c) => within(c).getByRole("heading").textContent)).toEqual(["zeta part one", "zeta part two"]);
    });

    it("filters by genre and year", async () => {
        const { user } = renderApp("/movies");
        await resultCards();

        await user.click(screen.getByRole("button", { name: /Genre/ }));
        await user.click(await screen.findByRole("option", { name: "Action" }));
        await waitFor(() => {
            expect(requestsTo("/discover/movie").at(-1)?.searchParams.get("with_genres")).toBe("28");
        });

        await user.click(screen.getByRole("button", { name: /Release year/ }));
        await user.click(await screen.findByRole("option", { name: "2015" }));
        await waitFor(() => {
            expect(requestsTo("/discover/movie").at(-1)?.searchParams.get("primary_release_year")).toBe("2015");
        });
    });

    it("paginates", async () => {
        const { user, router } = renderApp("/movies");
        await resultCards();

        await user.click(screen.getAllByRole("button", { name: /Next/ })[0]);
        await waitFor(() => {
            expect(requestsTo("/discover/movie").at(-1)?.searchParams.get("page")).toBe("2");
        });
        expect(router.state.location.search).toBe("?page=2");
    });

    it("shows an error with a working retry", async () => {
        let calls = 0;
        server.use(
            http.get(api("/discover/movie"), () => {
                calls += 1;
                return calls === 1
                    ? HttpResponse.json({ status_message: "Service unavailable." }, { status: 503 })
                    : HttpResponse.json(paged([{ id: 77, title: "Recovered", poster_path: null }]));
            }),
        );
        const { user, container } = renderApp("/movies");

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("We could not load movies");
        expect(alert).toHaveTextContent("Service unavailable.");
        expect(await axe(container)).toHaveNoViolations();

        await user.click(within(alert).getByRole("button", { name: "Try again" }));
        expect(await screen.findByRole("link", { name: /Recovered/ })).toBeInTheDocument();
    });

    it("shows an empty state that can clear the filters", async () => {
        server.use(http.get(api("/search/movie"), () => HttpResponse.json(paged([]))));
        const { user, router, container } = renderApp("/movies?q=zzzz");

        expect(await screen.findByRole("heading", { name: "No movies found" })).toBeInTheDocument();
        expect(screen.getByRole("status", { name: "" })).toHaveTextContent("No movies found.");
        expect(await axe(container)).toHaveNoViolations();

        await user.click(screen.getByRole("button", { name: "Clear filters" }));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 350));
        });
        expect(router.state.location.search).toBe("");
        expect(await resultCards()).toHaveLength(3);
    });
});

describe("Series page", () => {
    it("lists series and has no axe violations", async () => {
        const { container } = renderApp("/series");
        await findPageHeading("Series");
        expect(await resultCards()).toHaveLength(2);
        expect(screen.getByRole("status", { name: "" })).toHaveTextContent("2 series found.");
        expect(requestsTo("/discover/tv")[0]?.searchParams.get("sort_by")).toBe("vote_average.desc");
        expect(await axe(container)).toHaveNoViolations();
    });
});
