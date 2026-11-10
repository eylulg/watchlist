import { Suspense } from "react";
import { Skeleton } from "@eylulg/ui/skeleton";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageIntroClass, pageTitleClass } from "@/components/app/styles";
import { SearchView } from "@/components/search/search-view";
import { resolveLocale } from "@/lib/route-params";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const t = await getTranslations({ locale: resolveLocale((await params).locale), namespace: "Search" });
    return { title: t("title") };
}

export default async function SearchPage({ params }: PageProps) {
    const t = await getTranslations({ locale: resolveLocale((await params).locale), namespace: "Search" });
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className={pageTitleClass}>{t("title")}</h1>
                <p className={pageIntroClass}>{t("intro")}</p>
            </div>
            {/* The view reads the query from the URL, which only exists per request, so it renders in the browser. */}
            <Suspense fallback={<Skeleton shape="rect" className="h-28 max-w-xl" />}>
                <SearchView />
            </Suspense>
        </div>
    );
}
