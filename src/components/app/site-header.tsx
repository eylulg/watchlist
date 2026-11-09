"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/utils/cx";
import { ThemeToggle } from "./theme-toggle";
import { WatchlistCount } from "./watchlist-count";

const NAV_ITEMS = [
    { href: "/", key: "home", exact: true },
    { href: "/search", key: "search", exact: false },
    { href: "/watchlist", key: "watchlist", exact: false },
    { href: "/settings", key: "settings", exact: false },
] as const;

export const SiteHeader = () => {
    const t = useTranslations("Nav");
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-30 border-b border-secondary bg-primary/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-md text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-brand-solid text-white">
                        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
                            <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5z" />
                        </svg>
                    </span>
                    {t("brand")}
                </Link>
                <nav aria-label={t("label")} className="order-last w-full md:order-0 md:w-auto md:flex-1">
                    <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
                        {NAV_ITEMS.map((item) => {
                            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={cx(
                                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
                                            isActive
                                                ? "bg-active text-secondary_hover"
                                                : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                        )}
                                    >
                                        {t(item.key)}
                                        {item.key === "watchlist" && <WatchlistCount />}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <ThemeToggle />
            </div>
        </header>
    );
};
