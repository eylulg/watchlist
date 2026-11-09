import { Star01 } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { type TitleSummary, releaseYear, titleHref } from "@/lib/tmdb/types";
import { cx } from "@/utils/cx";
import { Poster } from "./poster";
import { cardLinkClass, cardTitleClass, posterFrameClass, skeletonClass } from "./styles";
import { WatchlistToggle } from "./watchlist-toggle";

interface TitleCardProps {
    title: TitleSummary;
    sizes: string;
    priority?: boolean;
}

export const TitleCard = ({ title, sizes, priority }: TitleCardProps) => {
    const t = useTranslations("Common");
    const year = releaseYear(title.releaseDate);
    const facts = [t(title.mediaType === "movie" ? "movie" : "series"), year].filter(Boolean).join(" · ");

    return (
        <article className="relative">
            <Link href={titleHref(title)} data-card-link className={cardLinkClass}>
                <div className={posterFrameClass}>
                    {/* The link text below names the title, so the poster is decorative here. */}
                    <Poster
                        path={title.posterPath}
                        alt=""
                        sizes={sizes}
                        priority={priority}
                        className="transition duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                </div>
                <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className={cardTitleClass}>{title.title}</h3>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-tertiary">
                        <span>{facts}</span>
                        {title.voteCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                                <Star01 aria-hidden="true" className="text-warning-400 size-3 fill-current" />
                                <span className="sr-only">{t("ratedOutOf10", { rating: title.rating.toFixed(1) })}</span>
                                <span aria-hidden="true">{title.rating.toFixed(1)}</span>
                            </span>
                        )}
                    </p>
                </div>
            </Link>
            <WatchlistToggle
                title={{
                    id: title.id,
                    mediaType: title.mediaType,
                    title: title.title,
                    posterPath: title.posterPath,
                    releaseDate: title.releaseDate,
                }}
            />
        </article>
    );
};

export const TitleCardSkeleton = () => (
    <div aria-hidden="true" className="flex flex-col gap-2">
        <div className={cx(skeletonClass, "aspect-2/3 w-full rounded-xl")} />
        <div className={cx(skeletonClass, "h-4 w-4/5 rounded")} />
        <div className={cx(skeletonClass, "h-3 w-1/3 rounded")} />
    </div>
);
