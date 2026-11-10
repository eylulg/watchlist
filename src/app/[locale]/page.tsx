import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Carousel, CarouselSkeleton } from "@/components/app/carousel";
import { ErrorState } from "@/components/app/states";
import { TitleCard } from "@/components/app/title-card";
import type { AppLocale } from "@/i18n/config";
import { localeAlternates } from "@/lib/metadata";
import { resolveLocale } from "@/lib/route-params";
import { getList, getTrending } from "@/lib/tmdb/client";
import { ROW_POSTER_SIZES } from "@/lib/tmdb/images";
import type { Paged, TitleSummary } from "@/lib/tmdb/types";

interface RowProps {
    title: string;
    load: () => Promise<Paged<TitleSummary>>;
    /** The first row's first posters are above the fold. */
    priority?: boolean;
}

/** One streamed row. A failing row shows its own error instead of taking the whole page down. */
const TitleRow = async ({ title, load, priority = false }: RowProps) => {
    // Render per request, so builds never call TMDB; the responses themselves are cached by fetch.
    await connection();
    const t = await getTranslations("Errors");
    let data: Paged<TitleSummary>;
    try {
        data = await load();
    } catch {
        return (
            <section aria-label={title}>
                <ErrorState title={t("rowTitle", { row: title })} message={t("rowMessage")} />
            </section>
        );
    }
    return (
        <Carousel title={title}>
            {data.results.slice(0, 20).map((item, index) => (
                <li key={`${item.mediaType}-${String(item.id)}`}>
                    <TitleCard title={item} sizes={ROW_POSTER_SIZES} priority={priority && index === 0} />
                </li>
            ))}
        </Carousel>
    );
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    return { alternates: localeAlternates(resolveLocale((await params).locale), "") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const locale: AppLocale = resolveLocale((await params).locale);
    const t = await getTranslations("Home");

    const rows: RowProps[] = [
        { title: t("trending"), load: () => getTrending(locale, "week"), priority: true },
        { title: t("popularMovies"), load: () => getList("movie", "popular", locale) },
        { title: t("popularSeries"), load: () => getList("tv", "popular", locale) },
        { title: t("topRatedMovies"), load: () => getList("movie", "top_rated", locale) },
        { title: t("topRatedSeries"), load: () => getList("tv", "top_rated", locale) },
    ];

    return (
        <div className="flex flex-col gap-10 md:gap-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-primary md:text-3xl">{t("title")}</h1>
                <p className="max-w-prose text-md text-tertiary md:text-lg">{t("intro")}</p>
            </div>
            {rows.map((row) => (
                <Suspense key={row.title} fallback={<CarouselSkeleton title={row.title} />}>
                    <TitleRow {...row} />
                </Suspense>
            ))}
        </div>
    );
}
