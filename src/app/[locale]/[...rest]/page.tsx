import { notFound } from "next/navigation";

/** Sends unknown paths inside a locale to the localised 404 page. */
export default function CatchAll() {
    notFound();
}
