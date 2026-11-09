import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/render";
import { Carousel } from "../carousel";

const renderRow = () =>
    renderWithProviders(
        <Carousel title="Trending">
            {["One", "Two", "Three"].map((name) => (
                <li key={name}>
                    <a href={`/${name}`} data-card-link>
                        {name}
                    </a>
                </li>
            ))}
        </Carousel>,
    );

describe("Carousel", () => {
    it.each([
        ["ArrowRight", "{ArrowRight}", "Two"],
        ["ArrowLeft at the start", "{ArrowLeft}", "One"],
        ["End", "{End}", "Three"],
        ["Home after End", "{End}{Home}", "One"],
    ])("moves focus between cards with %s", async (_, keys, expected) => {
        const { user } = renderRow();
        screen.getByRole("link", { name: "One" }).focus();

        await user.keyboard(keys);

        expect(screen.getByRole("link", { name: expected })).toHaveFocus();
    });
});
