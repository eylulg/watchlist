import type { MediaType, TitleSummary } from "@/api/tmdb";

export const titlePath = (title: Pick<TitleSummary, "mediaType" | "id">) => `/${title.mediaType}/${String(title.id)}`;

export const listPath: Record<MediaType, string> = { movie: "/movies", tv: "/series" };
