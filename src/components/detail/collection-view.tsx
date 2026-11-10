import { cx } from "@eylulg/ui/cx";
import { useTranslations } from "next-intl";
import { Poster } from "@/components/app/poster";
import { CardGrid } from "@/components/app/states";
import { pageTitleClass, sectionTitleClass, stableHeightClass } from "@/components/app/styles";
import { TitleCard } from "@/components/app/title-card";
import { DETAIL_POSTER_SIZES, GRID_POSTER_SIZES } from "@/lib/tmdb/images";
import type { CollectionDetail } from "@/lib/tmdb/types";

export const CollectionView = ({ collection }: { collection: CollectionDetail }) => {
    const t = useTranslations("Collection");

    return (
        <article className={cx(stableHeightClass, "flex flex-col gap-10")}>
            <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                <div className="w-40 shrink-0 self-center overflow-hidden rounded-2xl ring-1 ring-default md:w-56 md:self-start">
                    <Poster
                        path={collection.posterPath}
                        alt={t("posterAlt", { name: collection.name })}
                        sizes={DETAIL_POSTER_SIZES}
                        priority
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                    <h1 className={pageTitleClass}>{collection.name}</h1>
                    <p className="text-sm text-tertiary">{t("partCount", { count: collection.parts.length })}</p>
                    <p className="max-w-prose text-md text-secondary">{collection.overview || t("noOverview")}</p>
                </div>
            </div>
            <section aria-labelledby="parts" className="flex flex-col gap-4">
                <h2 id="parts" className={sectionTitleClass}>
                    {t("parts")}
                </h2>
                <CardGrid>
                    {collection.parts.map((part) => (
                        <li key={part.id}>
                            <TitleCard title={part} sizes={GRID_POSTER_SIZES} />
                        </li>
                    ))}
                </CardGrid>
            </section>
        </article>
    );
};
