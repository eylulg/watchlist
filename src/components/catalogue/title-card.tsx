import { Star01 } from "@untitledui/icons";
import { Link } from "react-router";
import { type TitleSummary, releaseYear } from "@/api/tmdb";
import { titlePath } from "@/lib/paths";
import { cx } from "@/utils/cx";
import { FavoriteToggle } from "./favorite-toggle";
import { Poster } from "./poster";

interface TitleCardProps {
    title: TitleSummary;
    sizes: string;
    priority?: boolean;
    className?: string;
}

export const TitleCard = ({ title, sizes, priority, className }: TitleCardProps) => {
    const year = releaseYear(title.releaseDate);

    return (
        <article className={cx("relative", className)}>
            <Link
                to={titlePath(title)}
                className="group flex flex-col gap-2 rounded-xl outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-4"
            >
                <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
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
                    <h3 className="line-clamp-2 text-sm font-semibold text-primary group-hover:underline">{title.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-tertiary">
                        {year && <span>{year}</span>}
                        {year && title.voteCount > 0 && <span aria-hidden="true">·</span>}
                        {title.voteCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                                <Star01 aria-hidden="true" className="text-warning-400 size-3 fill-current" />
                                <span className="sr-only">Rated </span>
                                {title.rating.toFixed(1)}
                                <span className="sr-only"> out of 10</span>
                            </span>
                        )}
                    </p>
                </div>
            </Link>
            <FavoriteToggle title={title} className="absolute top-2 right-2" />
        </article>
    );
};

export const TitleCardSkeleton = ({ className }: { className?: string }) => (
    <div aria-hidden="true" className={cx("flex flex-col gap-2", className)}>
        <div className="aspect-2/3 w-full animate-pulse rounded-xl bg-tertiary motion-reduce:animate-none" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-tertiary motion-reduce:animate-none" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-tertiary motion-reduce:animate-none" />
    </div>
);
