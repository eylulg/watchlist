import { Film01 } from "@untitledui/icons";
import { posterSources } from "@/lib/images";
import { cx } from "@/utils/cx";

interface PosterProps {
    path: string | null;
    /** Empty string when the poster sits inside a link that already names the title. */
    alt: string;
    sizes: string;
    className?: string;
    /** Use for the first, above the fold image on a page. */
    priority?: boolean;
}

export const Poster = ({ path, alt, sizes, className, priority = false }: PosterProps) => {
    if (!path) {
        return (
            <div
                role={alt ? "img" : undefined}
                aria-label={alt || undefined}
                className={cx("flex aspect-2/3 flex-col items-center justify-center gap-2 bg-tertiary text-quaternary", className)}
            >
                <Film01 aria-hidden="true" className="size-8" />
                <span className="text-xs font-medium">No poster</span>
            </div>
        );
    }

    const { src, srcSet } = posterSources(path);
    return (
        <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={342}
            height={513}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={cx("aspect-2/3 w-full bg-tertiary object-cover", className)}
        />
    );
};
