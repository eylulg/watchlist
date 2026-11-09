import { useTranslations } from "next-intl";
import Image from "next/image";

const linkClass = "font-semibold text-secondary underline underline-offset-2 outline-focus-ring hover:text-primary focus-visible:outline-2";

export const SiteFooter = () => {
    const t = useTranslations("Footer");

    return (
        <footer className="border-t border-secondary">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-tertiary md:px-8">
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
                <p>
                    {t("builtBy")}{" "}
                    <a href="https://github.com/eylulg/movies-series-website-demo" className={linkClass}>
                        {t("source")}
                    </a>
                </p>
            </div>
        </footer>
    );
};
