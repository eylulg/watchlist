import { useTranslations } from "next-intl";
import Image from "next/image";

const linkClass = "font-semibold text-secondary underline underline-offset-2 hover:text-primary";

/** TMDB and JustWatch require these credits on every page, and the shared footer has no slot for them. */
export const Attribution = () => {
    const t = useTranslations("Footer");

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-subtle px-4 py-6 text-sm text-tertiary md:px-8">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {/* TMDB asks for its logo next to the attribution notice. An SVG needs no optimising. */}
                <Image src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} unoptimized className="h-3 w-auto" />
                <span>
                    {t.rich("tmdb", {
                        link: (chunks) => (
                            <a href="https://www.themoviedb.org/" className={linkClass}>
                                {chunks}
                            </a>
                        ),
                    })}
                </span>
            </p>
            <p>
                {t.rich("justwatch", {
                    link: (chunks) => (
                        <a href="https://www.justwatch.com/" className={linkClass}>
                            {chunks}
                        </a>
                    ),
                })}
            </p>
        </div>
    );
};
