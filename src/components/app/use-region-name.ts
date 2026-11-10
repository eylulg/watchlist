import { useTranslations } from "next-intl";
import { isWatchRegion } from "@/lib/regions";

/** Returns the region's name in the current locale, or the bare code for a region the app has no name for. */
export const useRegionName = () => {
    const t = useTranslations("Regions");
    return (code: string) => (isWatchRegion(code) ? t(code) : code);
};
