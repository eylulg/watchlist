import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMovie, getSeries } from "@/lib/tmdb/client";
import { axe, renderWithProviders } from "@/test-utils/render";
import { TitleDetailView } from "../title-detail-view";

const stored = () =>
    (JSON.parse(window.localStorage.getItem("watchlist:v1") ?? "{}") as { items?: { status: string; runtime: number | null }[] }).items ??
    [];

describe("TitleDetailView", () => {
    it("adds the title with its length and moves focus to the status control", async () => {
        const { user } = renderWithProviders(<TitleDetailView detail={await getMovie(42, "en")} region="US" />);

        await user.click(screen.getByRole("button", { name: "Add to watchlist" }));

        expect(screen.getByRole("combobox", { name: "Status" })).toHaveFocus();
        expect(stored()).toEqual([expect.objectContaining({ status: "to-watch", runtime: 155 })]);
    });

    it("stores a series' length as episode length times episodes", async () => {
        const { user } = renderWithProviders(<TitleDetailView detail={await getSeries(7, "en")} region="US" />);

        await user.click(screen.getByRole("button", { name: "Add to watchlist" }));

        expect(stored()[0]?.runtime).toBe(900);
    });

    it("moves focus back to Add after removing the title", async () => {
        const { user } = renderWithProviders(<TitleDetailView detail={await getMovie(42, "en")} region="US" />);
        await user.click(screen.getByRole("button", { name: "Add to watchlist" }));

        await user.click(screen.getByRole("button", { name: "Remove from watchlist" }));

        expect(screen.getByRole("button", { name: "Add to watchlist" })).toHaveFocus();
        expect(stored()).toEqual([]);
    });

    it.each([
        ["lists offers for a region that has them", "US", ["Stream One", "Stream Two", "Rent Shop"]],
        ["says so for a region without offers", "JP", ["Movie 42 is not available to stream, rent or buy in this region right now."]],
    ])("where to watch %s, credited to JustWatch", async (_, region, texts) => {
        renderWithProviders(<TitleDetailView detail={await getMovie(42, "en")} region={region} />);

        const panel = screen.getByRole("region", { name: "Where to watch" });

        for (const text of texts) expect(panel).toHaveTextContent(text);
        expect(screen.getByRole("link", { name: "JustWatch" })).toHaveAttribute("href", "https://www.justwatch.com/");
    });

    it("links videos out to YouTube in a new tab", async () => {
        renderWithProviders(<TitleDetailView detail={await getMovie(42, "en")} region="US" />);

        const trailer = screen.getByRole("link", { name: /Official trailer/ });

        expect(trailer).toHaveAttribute("href", "https://www.youtube.com/watch?v=trailer1");
        expect(trailer).toHaveAttribute("target", "_blank");
    });

    it("has no axe violations", async () => {
        const { container } = renderWithProviders(<TitleDetailView detail={await getMovie(42, "en")} region="US" />);

        expect(await axe(container)).toHaveNoViolations();
    });
});
