import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
