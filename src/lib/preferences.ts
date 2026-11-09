import { cookies } from "next/headers";
import "server-only";
import { type AppLocale, defaultRegion } from "@/i18n/config";
import { REGION_COOKIE, isRegionCode } from "./regions";

/** The "where to watch" region: the user's choice from Settings, or a sensible default for the locale. */
export const getRegion = async (locale: AppLocale): Promise<string> => {
    const value = (await cookies()).get(REGION_COOKIE)?.value;
    return isRegionCode(value) ? value : defaultRegion[locale];
};
