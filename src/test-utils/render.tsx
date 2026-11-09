import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { configureAxe } from "vitest-axe";
import { ThemeProvider } from "@/components/app/theme-provider";
import type { AppLocale } from "@/i18n/config";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { setUrl } from "./navigation";

const messages = { en, tr, de };

/** Renders with the real providers. Only the network (msw) and Next's router (./navigation) are stand-ins. */
export const renderWithProviders = (ui: ReactElement, { locale = "en", url }: { locale?: AppLocale; url?: string } = {}) => {
    setUrl(url ?? `/${locale}`);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const user = userEvent.setup();
    const utils = render(
        <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="UTC">
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
            </ThemeProvider>
        </NextIntlClientProvider>,
    );
    return { ...utils, user };
};

/** jsdom cannot compute colours, so contrast is checked by the Playwright suite in a real browser instead. */
export const axe = configureAxe({ rules: { "color-contrast": { enabled: false } } });
