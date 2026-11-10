"use client";

import type { Ref } from "react";
import { Select, SelectItem } from "@eylulg/ui/select";
import { useTranslations } from "next-intl";
import { WATCH_STATUSES, type WatchStatus, watchStatusSchema } from "@/lib/watchlist/schema";

interface StatusSelectProps {
    value: WatchStatus;
    onChange: (status: WatchStatus) => void;
    /** Visible label. Omit it when several selects share one, and name each with `ariaLabel`. */
    label?: string;
    ariaLabel?: string;
    /** The wrapper, so a caller can move focus to the select after it appears. */
    ref?: Ref<HTMLDivElement>;
}

export const StatusSelect = ({ value, onChange, label, ariaLabel, ref }: StatusSelectProps) => {
    const t = useTranslations("Status");

    function handleChange(key: unknown) {
        const parsed = watchStatusSchema.safeParse(key);
        if (parsed.success) onChange(parsed.data);
    }

    return (
        <div ref={ref} className="w-44">
            <Select
                label={label}
                aria-label={ariaLabel}
                value={value}
                onChange={handleChange}
                items={WATCH_STATUSES.map((status) => ({ id: status, name: t(status) }))}
            >
                {(status) => <SelectItem id={status.id}>{status.name}</SelectItem>}
            </Select>
        </div>
    );
};
