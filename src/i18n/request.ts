import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: override }) => {
    // An explicit locale, for example from getTranslations({ locale }) in metadata, wins over the URL segment.
    const requested = override ?? (await rootLocale());
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    const messages = (await import(`../messages/${locale}.json`)) as { default: Record<string, unknown> };

    return {
        locale,
        messages: messages.default,
        timeZone: "UTC",
    };
});
