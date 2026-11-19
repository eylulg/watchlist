import { Skeleton } from "@eylulg/ui/skeleton";

const STAT_TILES = 6;
const ROWS = 6;

/**
 * Stands in for the stats, filters and first rows while the list loads from the browser's storage. The
 * server cannot know how many titles there are, so it reserves the shape of a list rather than an empty page.
 */
export const WatchlistSkeleton = () => (
    <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: STAT_TILES }, (_, i) => (
                <Skeleton key={i} shape="rect" className="h-24 rounded-xl" />
            ))}
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton shape="rect" className="h-control-md max-w-3xl rounded-lg" />
            <div className="flex flex-col gap-3">
                {Array.from({ length: ROWS }, (_, i) => (
                    <Skeleton key={i} shape="rect" className="h-[4.5rem] rounded-xl" />
                ))}
            </div>
        </div>
    </div>
);
