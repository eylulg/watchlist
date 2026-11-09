import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { series } from "@/test/fixtures";
import { axe, findPageHeading, renderApp } from "@/test/render";
import { api, server } from "@/test/server";

describe("Title detail page", () => {
    it("shows poster, overview, genres, rating, runtime and the top 6 cast", async () => {
        const { container } = renderApp("/movie/42");
        await findPageHeading(/Movie 42/);

        expect(screen.getByRole("img", { name: "Poster of Movie 42" })).toHaveAttribute("loading", "eager");
        expect(screen.getByText("Overview of movie 42")).toBeInTheDocument();
        expect(screen.getByText("2h 35m")).toBeInTheDocument();
        expect(screen.getByText(/7\.5 \/ 10 from 1,200 votes/)).toBeInTheDocument();
        expect(
            within(screen.getByRole("list", { name: "Genres" }))
                .getAllByRole("listitem")
                .map((li) => li.textContent),
        ).toEqual(["Science Fiction", "Adventure"]);

        const cast = within(screen.getByRole("region", { name: "Top cast" })).getAllByRole("listitem");
        expect(cast).toHaveLength(6);
        // Actor 2 has no photo, so initials are shown instead of a broken image.
        expect(screen.queryByRole("img", { name: "Actor 2" })).not.toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Actor 8" })).toHaveAttribute("loading", "lazy");

        expect(await axe(container)).toHaveNoViolations();
    });

    it("falls back gracefully when a series has no poster, overview, runtime or cast", async () => {
        server.use(
            http.get(api("/tv/9"), () =>
                HttpResponse.json({
                    ...series(9, { poster_path: null, overview: "" }),
                    episode_run_time: [],
                    number_of_seasons: 1,
                    genres: [],
                    credits: { cast: [] },
                }),
            ),
        );
        const { container } = renderApp("/tv/9");
        await findPageHeading(/Series 9/);

        expect(screen.getByRole("img", { name: "Poster of Series 9" })).toHaveTextContent("No poster");
        expect(screen.getByText("No overview is available for this title yet.")).toBeInTheDocument();
        expect(screen.getByText("Cast information is not available for this title.")).toBeInTheDocument();
        expect(screen.getByText("1 season")).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    it("shows a not found state for an unknown id", async () => {
        server.use(http.get(api("/movie/999"), () => HttpResponse.json({ status_message: "Not found" }, { status: 404 })));
        renderApp("/movie/999");
        expect(await screen.findByRole("heading", { level: 1, name: "Title not found" })).toBeInTheDocument();
    });

    it("shows an error state with retry for server errors", async () => {
        let calls = 0;
        server.use(
            http.get(api("/movie/5"), () => {
                calls += 1;
                return calls === 1
                    ? HttpResponse.json({}, { status: 500 })
                    : HttpResponse.json({ ...series(5), id: 5, title: "Back again", credits: { cast: [] } });
            }),
        );
        const { user } = renderApp("/movie/5");
        const alert = await screen.findByRole("alert");
        await user.click(within(alert).getByRole("button", { name: "Try again" }));
        expect(await findPageHeading(/Back again/)).toBeInTheDocument();
    });
});
