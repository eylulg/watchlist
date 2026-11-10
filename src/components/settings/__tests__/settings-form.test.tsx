import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { router } from "@/test-utils/navigation";
import { axe, renderWithProviders } from "@/test-utils/render";
import { chooseOption } from "@/test-utils/select";
import { SettingsForm } from "../settings-form";

describe("SettingsForm", () => {
    it("saves the region in a cookie, refreshes server data and confirms it", async () => {
        const { user } = renderWithProviders(<SettingsForm region="US" />, { url: "/en/settings" });

        await chooseOption(user, screen.getByRole("button", { name: /Region/ }), "Türkiye");

        expect(document.cookie).toContain("watchlist-region=TR");
        expect(router.refresh).toHaveBeenCalled();
        expect(screen.getByRole("status")).toHaveTextContent("Region set to Türkiye.");
    });

    it("names regions from the messages, not from the runtime's ICU data, so server and browser agree", () => {
        vi.spyOn(Intl, "DisplayNames").mockImplementation(function () {
            return { of: () => "Hong Kong SAR China" } as unknown as Intl.DisplayNames;
        });

        renderWithProviders(<SettingsForm region="HK" />, { url: "/en/settings" });

        expect(screen.getByRole("button", { name: /Region/ })).toHaveTextContent("Hong Kong");
        expect(screen.getByRole("button", { name: /Region/ })).not.toHaveTextContent("SAR");
    });

    it("switches language by moving to the same page in the other locale", async () => {
        const { user } = renderWithProviders(<SettingsForm region="US" />, { url: "/en/settings" });

        await chooseOption(user, screen.getByRole("button", { name: /Language/ }), "Deutsch");

        expect(router.replace).toHaveBeenCalledWith("/de/settings");
    });

    it("has no axe violations", async () => {
        const { container } = renderWithProviders(<SettingsForm region="US" />, { url: "/en/settings" });

        expect(await axe(container)).toHaveNoViolations();
    });
});
