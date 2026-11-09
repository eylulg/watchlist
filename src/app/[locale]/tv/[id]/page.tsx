import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TitleDetailView } from "@/components/detail/title-detail-view";
import { getRegion } from "@/lib/preferences";
import { parseId, resolveLocale } from "@/lib/route-params";
import { getSeries, isNotFound } from "@/lib/tmdb/client";
import { tmdbImage } from "@/lib/tmdb/images";

interface PageProps {
    params: Promise<{ locale: string; id: string }>;
}

const load = async ({ params }: PageProps) => {
    const { locale: rawLocale, id } = await params;
    const locale = resolveLocale(rawLocale);
    try {
        return { locale, detail: await getSeries(parseId(id), locale) };
    } catch (error) {
        if (isNotFound(error)) notFound();
        throw error;
    }
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const { detail } = await load(props);
    return {
        title: detail.title,
        description: detail.overview.slice(0, 160),
        openGraph: detail.posterPath ? { images: [tmdbImage(detail.posterPath, "w500")] } : null,
    };
}

export default async function SeriesPage(props: PageProps) {
    const { locale, detail } = await load(props);
    return <TitleDetailView detail={detail} region={await getRegion(locale)} />;
}
