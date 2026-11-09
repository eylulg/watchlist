"use client";

import type { ChangeEvent, Ref } from "react";
import { useTranslations } from "next-intl";
import { NativeSelect } from "@/components/base/select/select-native";
import { WATCH_STATUSES, type WatchStatus, watchStatusSchema } from "@/lib/watchlist/schema";

interface StatusSelectProps {
    value: WatchStatus;
    onChange: (status: WatchStatus) => void;
    label: string;
    /** Overrides the visible label when several selects share it, so each has its own name. */
    ariaLabel?: string;
    ref?: Ref<HTMLSelectElement>;
}

export const StatusSelect = ({ value, onChange, label, ariaLabel, ref }: StatusSelectProps) => {
    const t = useTranslations("Status");

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        const parsed = watchStatusSchema.safeParse(event.target.value);
        if (parsed.success) onChange(parsed.data);
    }

    return (
        <NativeSelect
            ref={ref}
            label={label}
            aria-label={ariaLabel}
            size="sm"
            className="w-40"
            value={value}
            onChange={handleChange}
            options={WATCH_STATUSES.map((status) => ({ value: status, label: t(status) }))}
        />
    );
};
