import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PersonView } from '@/components/detail/person-view';
import { localeAlternates, metadataOrError } from '@/lib/metadata';
import { parseId, resolveLocale } from '@/lib/route-params';
import { getPerson, isNotFound } from '@/lib/tmdb/client';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const load = async ({ params }: PageProps) => {
  const { locale, id } = await params;
  try {
    return await getPerson(parseId(id), resolveLocale(locale));
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale, id } = await props.params;
  return metadataOrError(locale, async () => {
    const person = await load(props);
    return {
      title: person.name,
      description: person.biography.slice(0, 160),
      alternates: localeAlternates(locale, `/person/${id}`),
    };
  });
}

export default async function PersonPage(props: PageProps) {
  return <PersonView person={await load(props)} />;
}
