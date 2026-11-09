import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Providers } from "@/components/app/providers";
import { ServiceWorkerRegistration } from "@/components/app/service-worker-registration";
import { SiteFooter } from "@/components/app/site-footer";
import { SiteHeader } from "@/components/app/site-header";
import { themeScript } from "@/components/app/theme-provider";
import { routing } from "@/i18n/routing";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });

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

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Applies the saved theme before first paint, so there is no flash of the wrong theme. */}
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className={cx(inter.variable, "bg-primary text-primary antialiased")}>
                <NextIntlClientProvider>
                    <Providers>
                        <div className="flex min-h-dvh flex-col">
                            <a
                                href="#main"
                                className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:outline-2 focus:outline-focus-ring"
                            >
                                {t("skipToContent")}
                            </a>
                            <SiteHeader />
                            <main
                                id="main"
                                tabIndex={-1}
                                className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none md:px-8 md:py-10"
                            >
                                {children}
                            </main>
                            <SiteFooter />
                        </div>
                        <ServiceWorkerRegistration />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
