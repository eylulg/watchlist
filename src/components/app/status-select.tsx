'use client';

import type { Ref } from 'react';
import { Select, SelectItem } from '@eylulg/ui/select';
import { useTranslations } from 'next-intl';
import { WATCH_STATUSES, type WatchStatus, watchStatusSchema } from '@/lib/watchlist/schema';

interface StatusSelectProps {
  value: WatchStatus;
  onChange: (status: WatchStatus) => void;
  /** Visible label. Omit it when several selects share one, and name each with `ariaLabel`. */
  label?: string;
  ariaLabel?: string;
  /** Width of the select, for example `w-36`. Defaults to a width that fits the longest status. */
  className?: string;
  /** The select button, so a caller can move focus to it after it appears. */
  ref?: Ref<HTMLButtonElement>;
}

export const StatusSelect = ({
  value,
  onChange,
  label,
  ariaLabel,
  className = 'w-44',
  ref,
}: StatusSelectProps) => {
  const t = useTranslations('Status');

  function handleChange(key: unknown) {
    const parsed = watchStatusSchema.safeParse(key);
    if (parsed.success) onChange(parsed.data);
  }

  return (
    <div className={className}>
      <Select
        ref={ref}
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
