import { NavLink, Outlet, ScrollRestoration, useNavigation } from "react-router";
import { ThemeToggle } from "@/components/catalogue/theme-toggle";
import { RouteProvider } from "@/providers/router-provider";
import { cx } from "@/utils/cx";

const navItems = [
    { to: "/", label: "Home", end: true },
    { to: "/movies", label: "Movies", end: false },
    { to: "/series", label: "Series", end: false },
    { to: "/favorites", label: "Favorites", end: false },
];

const SiteHeader = () => (
    <header className="sticky top-0 z-30 border-b border-secondary bg-primary/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
            <NavLink
                to="/"
                className="flex items-center gap-2 rounded-md text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-brand-solid text-white">
                    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
                        <path d="M5 3.5v9l7.5-4.5z" />
                    </svg>
                </span>
                Streaming catalogue
            </NavLink>
            <div className="order-last w-full md:order-0 md:w-auto md:flex-1">
                <nav aria-label="Main">
                    <ul className="flex gap-1">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        cx(
                                            "block rounded-md px-2.5 py-1.5 text-sm font-semibold outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                                            isActive
                                                ? "bg-active text-secondary_hover"
                                                : "text-quaternary hover:bg-primary_hover hover:text-secondary",
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <ThemeToggle />
        </div>
    </header>
);

const SiteFooter = () => (
    <footer className="border-t border-secondary">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-tertiary md:px-8">
            <p>
                This product uses the TMDB API but is not endorsed or certified by TMDB. Data and images from{" "}
                <a
                    href="https://www.themoviedb.org/"
                    className="font-semibold text-secondary underline underline-offset-2 outline-focus-ring hover:text-primary focus-visible:outline-2"
                >
                    The Movie Database (TMDB)
                </a>
                .
            </p>
            <p>
                Built by Eylül Güneş.{" "}
                <a
                    href="https://github.com/eylulg/movies-series-website-demo"
                    className="font-semibold text-secondary underline underline-offset-2 outline-focus-ring hover:text-primary focus-visible:outline-2"
                >
                    Source on GitHub
                </a>
            </p>
        </div>
    </footer>
);

export const RootLayout = () => {
    const navigation = useNavigation();

    return (
        <RouteProvider>
            <div className="flex min-h-dvh flex-col">
                <a
                    href="#main"
                    className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:outline-2 focus:outline-focus-ring"
                >
                    Skip to content
                </a>
                <SiteHeader />
                <main
                    id="main"
                    tabIndex={-1}
                    aria-busy={navigation.state === "loading"}
                    className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none md:px-8 md:py-10"
                >
                    <Outlet />
                </main>
                <SiteFooter />
            </div>
            <ScrollRestoration />
        </RouteProvider>
    );
};
