import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe, findPageHeading, renderApp } from "@/test/render";

describe("404 page", () => {
    it("renders for unknown paths and invalid media types with no axe violations", async () => {
        const { container } = renderApp("/does/not/exist");
        await findPageHeading("Page not found");
        expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/");
        expect(await axe(container)).toHaveNoViolations();
    });

    it("handles a bad title id", async () => {
        renderApp("/movie/abc");
        expect(await findPageHeading("Page not found")).toBeInTheDocument();
    });
});
