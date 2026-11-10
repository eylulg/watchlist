/** Shared by the server (reading the cookie) and Settings (writing it). */
export const REGION_COOKIE = "watchlist-region";

export const isRegionCode = (value: unknown): value is string => typeof value === "string" && /^[A-Z]{2}$/.test(value);

/**
 * Regions TMDB has watch provider data for. A static list keeps Settings instant and avoids an extra
 * TMDB call; regions missing here simply show the "no offers" message. Their names live in the Regions
 * messages rather than in `Intl.DisplayNames`, whose output differs between Node and each browser and
 * made the server HTML disagree with the client.
 */
export const WATCH_REGIONS = [
    "AR",
    "AT",
    "AU",
    "BE",
    "BG",
    "BR",
    "CA",
    "CH",
    "CL",
    "CO",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GB",
    "GR",
    "HK",
    "HR",
    "HU",
    "ID",
    "IE",
    "IL",
    "IN",
    "IS",
    "IT",
    "JP",
    "KR",
    "LT",
    "LV",
    "MX",
    "MY",
    "NL",
    "NO",
    "NZ",
    "PE",
    "PH",
    "PL",
    "PT",
    "RO",
    "RS",
    "SE",
    "SG",
    "SI",
    "SK",
    "TH",
    "TR",
    "TW",
    "UA",
    "US",
    "ZA",
] as const;

/** Display name from the Regions messages, or the bare code for a region the app has no name for. */
export const regionName = (t: { has: (key: string) => boolean; (key: string): string }, code: string): string =>
    t.has(code) ? t(code) : code;

export const writeRegionCookie = (code: string) => {
    document.cookie = `${REGION_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${String(60 * 60 * 24 * 365)}; samesite=lax`;
};
