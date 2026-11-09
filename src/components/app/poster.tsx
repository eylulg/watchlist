import { Film01, User01 } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb/images";
import { cx } from "@/utils/cx";

interface PosterProps {
    path: string | null;
    /** Empty string when the image sits inside a link that already names the title. */
    alt: string;
    sizes: string;
    className?: string;
    /** Use for the first, above the fold image on a page. */
    priority?: boolean;
    variant?: "poster" | "profile";
}

/** A 2:3 TMDB poster or profile photo through next/image, with a labelled fallback when TMDB has none. */
export const Poster = ({ path, alt, sizes, className, priority = false, variant = "poster" }: PosterProps) => {
    const t = useTranslations("Common");
    const Icon = variant === "profile" ? User01 : Film01;

    return (
        <div className={cx("relative aspect-2/3 w-full overflow-hidden bg-tertiary", className)}>
            {path ? (
                <Image
                    src={tmdbImage(path, variant === "profile" ? "h632" : "w780")}
                    alt={alt}
                    fill
                    sizes={sizes}
                    priority={priority}
                    className="object-cover"
                />
            ) : (
                <div
                    role={alt ? "img" : undefined}
                    aria-label={alt || undefined}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-quaternary"
                >
                    <Icon aria-hidden="true" className="size-8" />
                    <span className="px-2 text-center text-xs font-medium">{variant === "profile" ? t("noPhoto") : t("noPoster")}</span>
                </div>
            )}
        </div>
    );
};
