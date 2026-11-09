import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { z } from "zod";
import { WATCH_STATUSES, type WatchlistItem, watchStatusSchema } from "./schema";

/**
 * Read only sharing without a server: the list is packed into compact tuples, compressed with lz-string
 * and put in the URL fragment. Fragments never reach the server, so nothing is stored or logged anywhere.
 */

export type SharedItem = Pick<WatchlistItem, "id" | "mediaType" | "title" | "posterPath" | "releaseDate" | "status" | "rating" | "note">;

export interface SharedList {
    name: string;
    items: SharedItem[];
}

/** Keeps share links within what browsers, chat apps and QR codes handle comfortably. */
export const MAX_SHARED_ITEMS = 300;

const SHARE_VERSION = 1;

const tupleSchema = z.tuple([
    z.enum(["m", "t"]),
    z.number().int().positive(),
    z.string().min(1).max(500),
    z.string().max(200),
    z.string().max(20),
    z
        .number()
        .int()
        .min(0)
        .max(WATCH_STATUSES.length - 1),
    z.number().int().min(0).max(10),
    z.string().max(1000).optional(),
]);

const payloadSchema = z.object({
    v: z.literal(SHARE_VERSION),
    n: z.string().max(80).optional(),
    i: z.array(tupleSchema).max(MAX_SHARED_ITEMS),
});

export const encodeSharedList = (
    items: SharedItem[],
    { name = "", includeNotes = false }: { name?: string; includeNotes?: boolean } = {},
): string => {
    const payload: z.infer<typeof payloadSchema> = {
        v: SHARE_VERSION,
        ...(name.trim() ? { n: name.trim().slice(0, 80) } : {}),
        i: items.slice(0, MAX_SHARED_ITEMS).map((item) => {
            const tuple: z.infer<typeof tupleSchema> = [
                item.mediaType === "movie" ? "m" : "t",
                item.id,
                item.title,
                item.posterPath ?? "",
                item.releaseDate,
                WATCH_STATUSES.indexOf(item.status),
                item.rating ?? 0,
            ];
            if (includeNotes && item.note) tuple.push(item.note);
            return tuple;
        }),
    };
    return compressToEncodedURIComponent(JSON.stringify(payload));
};

/** Returns null for anything that is not a valid shared list, including tampered or truncated links. */
export const decodeSharedList = (encoded: string): SharedList | null => {
    try {
        const json = decompressFromEncodedURIComponent(encoded.replace(/^#/, ""));
        if (!json) return null;
        const parsed = payloadSchema.safeParse(JSON.parse(json));
        if (!parsed.success) return null;
        return {
            name: parsed.data.n ?? "",
            items: parsed.data.i.map(([type, id, title, poster, releaseDate, status, rating, note]) => ({
                id,
                mediaType: type === "m" ? "movie" : "tv",
                title,
                posterPath: poster || null,
                releaseDate,
                status: watchStatusSchema.parse(WATCH_STATUSES[status]),
                rating: rating === 0 ? null : rating,
                note: note ?? "",
            })),
        };
    } catch {
        return null;
    }
};

/** Absolute share URL for the current origin and locale. */
export const buildShareUrl = (origin: string, locale: string, encoded: string) => `${origin}/${locale}/shared#${encoded}`;
