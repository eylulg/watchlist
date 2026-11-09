import { useFormatter, useTranslations } from "next-intl";
import type { WatchlistStats as Stats } from "@/lib/watchlist/stats";

export const WatchlistStats = ({ stats, headingId = "stats" }: { stats: Stats; headingId?: string }) => {
    const t = useTranslations("Stats");
    const format = useFormatter();

    const tiles = [
        { label: t("total"), value: format.number(stats.total), detail: t("split", { movies: stats.movies, series: stats.series }) },
        { label: t("toWatch"), value: format.number(stats.byStatus["to-watch"]) },
        { label: t("watching"), value: format.number(stats.byStatus.watching) },
        { label: t("watched"), value: format.number(stats.byStatus.watched) },
        {
            label: t("hoursWatched"),
            value: `${stats.isEstimate ? "≈ " : ""}${format.number(stats.hoursWatched, { maximumFractionDigits: 1 })}`,
            detail: stats.isEstimate ? t("estimate") : undefined,
        },
        {
            label: t("averageRating"),
            value: stats.averageRating === null ? t("noRating") : format.number(stats.averageRating, { maximumFractionDigits: 1 }),
        },
    ];

    return (
        <section aria-labelledby={headingId} className="flex flex-col gap-3">
            <h2 id={headingId} className="sr-only">
                {t("title")}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map((tile) => (
                    <div key={tile.label} className="flex flex-col gap-1 rounded-xl p-4 ring-1 ring-secondary">
                        <dt className="text-sm text-tertiary">{tile.label}</dt>
                        <dd className="text-display-xs font-semibold text-primary tabular-nums">{tile.value}</dd>
                        {tile.detail && <dd className="text-xs text-tertiary">{tile.detail}</dd>}
                    </div>
                ))}
            </dl>
        </section>
    );
};
