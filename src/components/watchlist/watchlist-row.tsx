"use client";

import { useState } from "react";
import { Badge } from "@eylulg/ui/badge";
import { Button } from "@eylulg/ui/button";
import { cx } from "@eylulg/ui/cx";
import { Select, SelectItem } from "@eylulg/ui/select";
import { Textarea } from "@eylulg/ui/textarea";
import { Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { StatusSelect } from "@/components/app/status-select";
import { Link } from "@/i18n/navigation";
import { tmdbImage } from "@/lib/tmdb/images";
import { releaseYear, titleHref } from "@/lib/tmdb/types";
import { type WatchStatus, type WatchlistItem, itemKey } from "@/lib/watchlist/schema";
import type { SharedItem } from "@/lib/watchlist/share";
import { watchlistActions } from "@/lib/watchlist/store";

interface WatchlistRowProps {
    item: WatchlistItem;
    onRemove: (item: WatchlistItem) => void;
}

const STATUS_BADGE_COLOR = { "to-watch": "gray", watching: "brand", watched: "success" } as const;

const rowClass = "flex gap-4 rounded-xl p-4 ring-1 ring-default";

const ratingOptions = (t: ReturnType<typeof useTranslations<"Watchlist">>) => [
    { id: "none", name: t("notRated") },
    ...Array.from({ length: 10 }, (_, i) => ({ id: String(10 - i), name: t("ratingOption", { rating: 10 - i }) })),
];

/** One editable watchlist entry: status, personal rating, note and remove. */
export const WatchlistRow = ({ item, onRemove }: WatchlistRowProps) => {
    const t = useTranslations("Watchlist");
    const format = useFormatter();
    const key = itemKey(item);

    function handleStatusChange(status: WatchStatus) {
        watchlistActions.setStatus(key, status);
    }

    function handleRatingChange(value: unknown) {
        const rating = Number(value);
        watchlistActions.update(key, { rating: Number.isInteger(rating) && rating >= 1 && rating <= 10 ? rating : null });
    }

    function handleRemove() {
        onRemove(item);
    }

    return (
        <li className={cx(rowClass, "flex-col")}>
            <div className="flex gap-4">
                <Thumb posterPath={item.posterPath} />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <Heading item={item} />
                        <p className="text-xs text-tertiary">
                            {t("addedOn", { date: format.dateTime(new Date(item.addedAt), { dateStyle: "medium" }) })}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        {/* The captions are shared by every row, so each control is named with the title instead. */}
                        <div className="flex flex-col gap-1.5">
                            <span aria-hidden="true" className="text-sm font-medium text-secondary">
                                {t("statusLabel")}
                            </span>
                            <StatusSelect
                                ariaLabel={t("statusFor", { title: item.title })}
                                value={item.status}
                                onChange={handleStatusChange}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span aria-hidden="true" className="text-sm font-medium text-secondary">
                                {t("ratingLabel")}
                            </span>
                            <div className="w-36">
                                <Select
                                    aria-label={t("ratingFor", { title: item.title })}
                                    value={item.rating === null ? "none" : String(item.rating)}
                                    onChange={handleRatingChange}
                                    items={ratingOptions(t)}
                                >
                                    {(option) => <SelectItem id={option.id}>{option.name}</SelectItem>}
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {/* Keyed by the saved note, so an edit from another tab replaces the field's draft. */}
                <NoteField key={item.note} item={item} />
                <Button
                    variant="secondary"
                    size="md"
                    iconLeading={Trash2}
                    aria-label={t("removeNamed", { title: item.title })}
                    onPress={handleRemove}
                >
                    {t("remove")}
                </Button>
            </div>
        </li>
    );
};

/** A read only entry for shared lists. */
export const SharedRow = ({ item }: { item: SharedItem }) => {
    const t = useTranslations("Watchlist");
    const ts = useTranslations("Status");
    return (
        <li className={rowClass}>
            <Thumb posterPath={item.posterPath} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Heading item={item} />
                <div className="flex flex-wrap items-center gap-2">
                    <Badge color={STATUS_BADGE_COLOR[item.status]} size="sm">
                        {ts(item.status)}
                    </Badge>
                    {item.rating !== null && <span className="text-sm text-secondary">{t("ratingOption", { rating: item.rating })}</span>}
                </div>
                {item.note && <p className="text-sm whitespace-pre-line text-secondary">{item.note}</p>}
            </div>
        </li>
    );
};

const NoteField = ({ item }: { item: WatchlistItem }) => {
    const t = useTranslations("Watchlist");
    const [note, setNote] = useState(item.note);

    function handleBlur() {
        if (note !== item.note) watchlistActions.update(itemKey(item), { note });
    }

    // The visible caption is shared by every row, so the field's own name includes the title.
    return (
        <div className="flex flex-1 flex-col gap-1.5">
            <span aria-hidden="true" className="text-sm font-medium text-secondary">
                {t("noteLabel")}
            </span>
            <Textarea
                aria-label={t("noteFor", { title: item.title })}
                placeholder={t("notePlaceholder")}
                rows={2}
                maxLength={1000}
                value={note}
                onChange={setNote}
                onBlur={handleBlur}
            />
        </div>
    );
};

const Thumb = ({ posterPath }: Pick<WatchlistItem, "posterPath">) => (
    <div className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-lg bg-tertiary ring-1 ring-default sm:w-20">
        {posterPath && <Image src={tmdbImage(posterPath, "w185")} alt="" fill sizes="80px" className="object-cover" />}
    </div>
);

const Heading = ({ item }: { item: SharedItem }) => {
    const tc = useTranslations("Common");
    const year = releaseYear(item.releaseDate);
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="text-md font-semibold text-primary">
                <Link href={titleHref(item)} data-row-title className="outline-focus hover:underline focus-visible:outline-2">
                    {item.title}
                </Link>
            </h3>
            <p className="text-sm text-tertiary">
                {[tc(item.mediaType === "movie" ? "movie" : "series"), year].filter(Boolean).join(" · ")}
            </p>
        </div>
    );
};
