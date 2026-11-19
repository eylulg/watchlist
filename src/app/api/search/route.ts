import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { locales } from '@/i18n/config';
import { createRateLimiter } from '@/lib/rate-limit';
import { SEARCH_KINDS, TmdbError, search } from '@/lib/tmdb/client';

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(SEARCH_KINDS).default('multi'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  locale: z.enum(locales).default('en'),
});

/** 60 searches a minute per client is far above what debounced typing and infinite scroll produce. */
const allowRequest = createRateLimiter({ limit: 60, windowMs: 60_000 });

const clientKey = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('x-real-ip') ??
  'local';

/**
 * Search proxy for the client side search page. The browser talks to this handler; only the server
 * talks to TMDB, so the key never leaves the server. No CORS headers are sent, so other origins cannot
 * read the responses, and cross site requests from browsers are refused outright.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Cross site requests are not allowed.' }, { status: 403 });
  }
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { error: 'Too many searches. Wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid search parameters.' }, { status: 400 });
  }

  const { q, type, page, locale } = parsed.data;
  try {
    const results = await search({ kind: type, query: q, page, locale });
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (error) {
    const status = error instanceof TmdbError && error.status === 429 ? 429 : 502;
    // Never forward TMDB's message: it can mention the credential.
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status });
  }
}
