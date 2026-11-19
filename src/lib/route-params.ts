import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";

/** Validates the locale segment. Unknown locales are a 404. */
export const resolveLocale = (value: string): AppLocale => {
    if (!hasLocale(routing.locales, value)) notFound();
    return value;
};

/** TMDB ids are positive integers. Anything else is a 404, without calling TMDB. */
export const parseId = (value: string): number => {
    if (!/^\d{1,9}$/.test(value)) notFound();
    const id = Number(value);
    if (id <= 0) notFound();
    return id;
};
