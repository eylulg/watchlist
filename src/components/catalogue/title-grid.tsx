import type { TitleSummary } from "@/api/tmdb";
import { GRID_POSTER_SIZES } from "@/lib/images";
import { cx } from "@/utils/cx";
import { TitleCard, TitleCardSkeleton } from "./title-card";

const gridClass = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6";

export const TitleGrid = ({ titles, className, label }: { titles: TitleSummary[]; className?: string; label: string }) => (
    <ul aria-label={label} className={cx(gridClass, className)}>
        {titles.map((title, index) => (
            <li key={`${title.mediaType}-${String(title.id)}`}>
                <TitleCard title={title} sizes={GRID_POSTER_SIZES} priority={index < 4} />
            </li>
        ))}
    </ul>
);

export const TitleGridSkeleton = ({ count = 12, label }: { count?: number; label: string }) => (
    <div role="status" aria-label={label} className={gridClass}>
        {Array.from({ length: count }, (_, i) => (
            <TitleCardSkeleton key={i} />
        ))}
    </div>
);
