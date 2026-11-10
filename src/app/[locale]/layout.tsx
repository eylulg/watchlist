import type { ReactNode } from "react";
import { AppShell, SiteFooter, themeInitScript } from "@eylulg/ui/chrome";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Nav } from "@/components/app/nav";
import { Providers } from "@/components/app/providers";
import { ServiceWorkerRegistration } from "@/components/app/service-worker-registration";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";

const creditLinkClass = "font-semibold text-secondary underline underline-offset-2 hover:text-primary";

interface LayoutProps {
    children: ReactNode;
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: "Meta" });
    return {
        title: { default: t("title"), template: `%s · ${t("title")}` },
        description: t("description"),
        applicationName: t("title"),
        manifest: "/manifest.webmanifest",
        appleWebApp: { capable: true, title: t("title"), statusBarStyle: "black-translucent" },
        icons: {
            icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
            apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
        },
        alternates: {
            languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
        },
    };
}

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0c111d" },
    ],
    colorScheme: "light dark",
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) notFound();
    const t = await getTranslations("Nav");
    const tf = await getTranslations("Footer");

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Applies the saved theme before first paint, so there is no flash of the wrong theme. */}
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body>
                <NextIntlClientProvider>
                    <Providers>
                        <AppShell
                            maxWidth="6xl"
                            skipLinkLabel={t("skipToContent")}
                            header={<Nav />}
                            footer={
                                <SiteFooter
                                    currentId="watchlist"
                                    labels={{
                                        intro: tf("intro"),
                                        projectsNav: tf("projectsNav"),
                                        source: tf("source"),
                                        profilesNav: tf("profilesNav"),
                                        github: tf("github"),
                                        linkedin: tf("linkedin"),
                                        builtWith: tf("builtWith"),
                                    }}
                                >
                                    {/* TMDB asks for its logo next to the attribution notice. An SVG needs no optimising. */}
                                    <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <Image src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} unoptimized className="h-3 w-auto" />
                                        <span>
                                            {tf.rich("tmdb", {
                                                link: (chunks) => (
                                                    <a href="https://www.themoviedb.org/" className={creditLinkClass}>
                                                        {chunks}
                                                    </a>
                                                ),
                                            })}
                                        </span>
                                    </p>
                                    <p>
                                        {tf.rich("justwatch", {
                                            link: (chunks) => (
                                                <a href="https://www.justwatch.com/" className={creditLinkClass}>
                                                    {chunks}
                                                </a>
                                            ),
                                        })}
                                    </p>
                                </SiteFooter>
                            }
                        >
                            {children}
                        </AppShell>
                        <ServiceWorkerRegistration />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
