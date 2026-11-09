import { Inter } from "next/font/google";
import Link from "next/link";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });

/** Shown for URLs that match no route at all. Localised 404s live in `[locale]/not-found.tsx`. */
export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body className={cx(inter.variable, "bg-primary text-primary antialiased")}>
                <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
                    <p className="text-md font-semibold text-brand-secondary">404</p>
                    <h1 className="text-display-sm font-semibold">Page not found</h1>
                    <p className="text-lg text-tertiary">This page does not exist.</p>
                    <Link href="/" className="font-semibold text-brand-secondary underline underline-offset-2">
                        Go to Watchlist
                    </Link>
                </main>
            </body>
        </html>
    );
}
