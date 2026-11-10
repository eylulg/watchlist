import { themeInitScript } from "@eylulg/ui/chrome";
import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";

export const metadata: Metadata = { title: "Page not found · Watchlist" };

/** Shown for URLs that match no route at all. Localised 404s live in `[locale]/not-found.tsx`. */
export default function GlobalNotFound() {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body className="bg-primary font-sans text-primary antialiased">
                <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
                    <p className="text-md font-semibold text-brand">404</p>
                    <h1 className="text-2xl font-semibold md:text-3xl">Page not found</h1>
                    <p className="text-lg text-tertiary">This page does not exist.</p>
                    <Link href="/" className="font-semibold text-brand underline underline-offset-2">
                        Go to Watchlist
                    </Link>
                </main>
            </body>
        </html>
    );
}
