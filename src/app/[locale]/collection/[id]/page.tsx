import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/detail/collection-view";
import { parseId, resolveLocale } from "@/lib/route-params";
import { getCollection, isNotFound } from "@/lib/tmdb/client";

interface PageProps {
    params: Promise<{ locale: string; id: string }>;
}

const load = async ({ params }: PageProps) => {
    const { locale, id } = await params;
    try {
        return await getCollection(parseId(id), resolveLocale(locale));
    } catch (error) {
        if (isNotFound(error)) notFound();
        throw error;
    }
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const collection = await load(props);
    return { title: collection.name, description: collection.overview.slice(0, 160) };
}

export default async function CollectionPage(props: PageProps) {
    return <CollectionView collection={await load(props)} />;
}
