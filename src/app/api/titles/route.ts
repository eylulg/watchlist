import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { locales } from '@/i18n/config';
import { createRateLimiter } from '@/lib/rate-limit';
import { getTitleSummary, isNotFound } from '@/lib/tmdb/client';

/** How many titles one request resolves. A shared list of 300 takes 12 requests. */
export const MAX_IDS_PER_REQUEST = 25;

const ID_PATTERN = /^[mt]\d{1,9}$/;

const querySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(z.string().regex(ID_PATTERN)).min(1).max(MAX_IDS_PER_REQUEST)),
  locale: z.enum(locales).default('en'),
});

const allowRequest = createRateLimiter({ limit: 60, windowMs: 60_000 });

const clientKey = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'local';

/**
 * Resolves title ids from a shared link to the fields a row shows. Ids TMDB no longer knows are left out
 * of the answer, so one removed title never fails the rest. Same protections as the search route.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Cross site requests are not allowed.' }, { status: 403 });
  }
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { error: 'Too many requests. Wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
  }

  const { ids, locale } = parsed.data;
  const settled = await Promise.allSettled(
    ids.map((entry) =>
      getTitleSummary(entry.startsWith('m') ? 'movie' : 'tv', Number(entry.slice(1)), locale),
    ),
  );
  // A missing title is expected (TMDB removes them); anything else means TMDB is failing, so let the client retry.
  if (settled.some((result) => result.status === 'rejected' && !isNotFound(result.reason))) {
    // Never forward TMDB's message: it can mention the credential.
    return NextResponse.json({ error: 'Titles are unavailable right now.' }, { status: 502 });
  }
  const titles = settled.flatMap((result) =>
    result.status === 'fulfilled'
      ? [
          {
            id: result.value.id,
            mediaType: result.value.mediaType,
            title: result.value.title,
            posterPath: result.value.posterPath,
            releaseDate: result.value.releaseDate,
          },
        ]
      : [],
  );
  return NextResponse.json(
    { titles },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
