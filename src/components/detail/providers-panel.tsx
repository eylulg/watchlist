import { useTranslations } from "next-intl";
import Image from "next/image";
import { inlineLinkClass, panelClass, panelTitleClass, sideLinkClass } from "@/components/app/styles";
import { Link } from "@/i18n/navigation";
import { regionName } from "@/lib/regions";
import { tmdbImage } from "@/lib/tmdb/images";
import type { ProviderKind, RegionProviders } from "@/lib/tmdb/types";

const KINDS: ProviderKind[] = ["flatrate", "free", "ads", "rent", "buy"];

interface ProvidersPanelProps {
    providers: Record<string, RegionProviders>;
    region: string;
    title: string;
}

/** "Where to watch" for one region. TMDB requires crediting JustWatch, which supplies this data. */
export const ProvidersPanel = ({ providers, region, title }: ProvidersPanelProps) => {
    const t = useTranslations("Providers");
    const tr = useTranslations("Regions");
    const offers = providers[region];
    const kinds = KINDS.filter((kind) => (offers?.[kind].length ?? 0) > 0);

    return (
        <section aria-labelledby="where-to-watch" className={panelClass}>
            <div className="flex flex-col gap-1">
                <h2 id="where-to-watch" className={panelTitleClass}>
                    {t("title")}
                </h2>
                <p className="text-sm text-tertiary">
                    {t.rich("region", {
                        region: regionName(tr, region),
                        link: (chunks) => (
                            <Link href="/settings" className={inlineLinkClass}>
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>

            {kinds.length === 0 || !offers ? (
                <p className="text-sm text-secondary">{t("none", { title })}</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {kinds.map((kind) => (
                        <div key={kind} className="flex flex-col gap-2">
                            <h3 className="text-sm font-semibold text-secondary">{t(kind)}</h3>
                            <ul className="flex flex-wrap gap-2">
                                {offers[kind].map((provider) => (
                                    <li
                                        key={provider.id}
                                        className="flex items-center gap-2 rounded-lg bg-secondary py-1 pr-3 pl-1 text-sm text-secondary"
                                    >
                                        {provider.logoPath ? (
                                            <Image
                                                src={tmdbImage(provider.logoPath, "w92")}
                                                alt=""
                                                width={28}
                                                height={28}
                                                className="size-7 rounded-md"
                                            />
                                        ) : (
                                            <span aria-hidden="true" className="size-7 rounded-md bg-tertiary" />
                                        )}
                                        {provider.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {offers.link && (
                        <a href={offers.link} rel="noopener noreferrer" target="_blank" className={sideLinkClass}>
                            {t("allOffers")}
                            <span className="sr-only"> {t("newTab")}</span>
                        </a>
                    )}
                </div>
            )}

            <p className="text-xs text-tertiary">
                {t.rich("attribution", {
                    link: (chunks) => (
                        <a
                            href="https://www.justwatch.com/"
                            rel="noopener noreferrer"
                            className="font-semibold text-secondary underline underline-offset-2 outline-focus focus-visible:outline-2"
                        >
                            {chunks}
                        </a>
                    ),
                })}
            </p>
        </section>
    );
};
