import { Suspense } from "react";
import { cx } from "@eylulg/ui/cx";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageIntroClass, pageTitleClass, stableHeightClass } from "@/components/app/styles";
import { WatchlistSkeleton } from "@/components/watchlist/watchlist-skeleton";
import { WatchlistView } from "@/components/watchlist/watchlist-view";
import { resolveLocale } from "@/lib/route-params";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const t = await getTranslations({ locale: resolveLocale((await params).locale), namespace: "Watchlist" });
    return { title: t("title") };
}

export default async function WatchlistPage({ params }: PageProps) {
    const t = await getTranslations({ locale: resolveLocale((await params).locale), namespace: "Watchlist" });
    // The list lives in localStorage and the filters in the URL, so the view renders in the browser.
    // The fallback gives the server HTML the same heading.
    return (
        <Suspense
            fallback={
                <div className={cx(stableHeightClass, "flex flex-col gap-8")} aria-busy="true">
                    <div className="flex flex-col gap-2">
                        <h1 className={pageTitleClass}>{t("title")}</h1>
                        <p className={pageIntroClass}>{t("intro")}</p>
                    </div>
                    <WatchlistSkeleton />
                </div>
            }
        >
            <WatchlistView />
        </Suspense>
    );
}
