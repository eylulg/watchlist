import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import * as z from "zod/mini";
import { WATCH_STATUSES, type WatchlistItem, type WatchlistTitle, watchStatusSchema } from "./schema";

/**
 * Read only sharing without a server: the list is packed into the URL fragment, which never reaches a
 * server, so nothing is stored or logged anywhere. A link carries only what cannot be looked up: the
 * title id, its type, the status and the rating. Titles and posters are fetched by id when the link is
 * opened, which keeps a link near 6 characters a title instead of 80.
 */

/** What a link stores about one title. */
export type SharedEntry = Pick<WatchlistItem, "id" | "mediaType" | "status" | "rating">;

/** A shared entry together with the title data looked up for it. */
export type SharedItem = SharedEntry & WatchlistTitle;

export interface SharedList {
    name: string;
    entries: SharedEntry[];
}

/** 300 titles come to about 2,500 characters, well under the 8,000 that chat apps and browsers handle. */
export const MAX_SHARED_ITEMS = 300;

const SHARE_VERSION = 2;

/** `m438631.18`: m or t, the id, a dot, the status index and the rating in base 36 (0 means none, a means 10). */
const ENTRY_PATTERN = /^([mt])(\d{1,9})\.([0-9])([0-9a])$/;

const payloadSchema = z.object({
    v: z.literal(SHARE_VERSION),
    n: z.optional(z.string().check(z.maxLength(80))),
    i: z.string().check(z.maxLength(MAX_SHARED_ITEMS * 16)),
});

export const encodeSharedList = (items: SharedEntry[], { name = "" }: { name?: string } = {}): string => {
    const entries = items
        .slice(0, MAX_SHARED_ITEMS)
        .map(
            (item) =>
                `${item.mediaType === "movie" ? "m" : "t"}${String(item.id)}.${String(WATCH_STATUSES.indexOf(item.status))}${(item.rating ?? 0).toString(36)}`,
        );
    const payload: z.infer<typeof payloadSchema> = {
        v: SHARE_VERSION,
        ...(name.trim() ? { n: name.trim().slice(0, 80) } : {}),
        i: entries.join(","),
    };
    return compressToEncodedURIComponent(JSON.stringify(payload));
};

const decodeEntry = (raw: string): SharedEntry | null => {
    const match = ENTRY_PATTERN.exec(raw);
    if (!match) return null;
    const [, type, id, statusIndex, rating] = match;
    const status = watchStatusSchema.safeParse(WATCH_STATUSES[Number(statusIndex)]);
    const ratingValue = Number.parseInt(rating ?? "", 36);
    if (!status.success || ratingValue > 10 || Number(id) === 0) return null;
    return {
        id: Number(id),
        mediaType: type === "m" ? "movie" : "tv",
        status: status.data,
        rating: ratingValue === 0 ? null : ratingValue,
    };
};

/** Returns null for anything that is not a valid shared list, including tampered or truncated links. */
export const decodeSharedList = (encoded: string): SharedList | null => {
    try {
        const json = decompressFromEncodedURIComponent(encoded.replace(/^#/, ""));
        if (!json) return null;
        const parsed = payloadSchema.safeParse(JSON.parse(json));
        if (!parsed.success) return null;
        const raw = parsed.data.i === "" ? [] : parsed.data.i.split(",");
        if (raw.length > MAX_SHARED_ITEMS) return null;
        const entries = raw.map(decodeEntry);
        if (entries.some((entry) => entry === null)) return null;
        return { name: parsed.data.n ?? "", entries: entries.filter((entry) => entry !== null) };
    } catch {
        return null;
    }
};

/** Absolute share URL for the current origin and locale. */
export const buildShareUrl = (origin: string, locale: string, encoded: string) => `${origin}/${locale}/shared#${encoded}`;
