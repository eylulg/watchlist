'use client';

import { type ReactNode, useState } from 'react';
import { cx } from '@eylulg/ui/cx';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

/** Above this many rows only the ones near the viewport are rendered. */
const VIRTUALISE_ABOVE = 50;

/** A compact row plus its gap; rows measure themselves once rendered, so this only sets the scrollbar's first guess. */
const ESTIMATED_ROW_HEIGHT = 84;

interface RowListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
}

const ROW_GAP_CLASS = 'pb-3';

/** A list of rows that windows itself once it is long, so a 300 title list stays as cheap as a 20 title one. */
export const RowList = <T,>({ items, getKey, renderRow }: RowListProps<T>) =>
  items.length > VIRTUALISE_ABOVE ? (
    <VirtualRows items={items} getKey={getKey} renderRow={renderRow} />
  ) : (
    <ul className='flex flex-col'>
      {items.map((item) => (
        <li key={getKey(item)} className={ROW_GAP_CLASS}>
          {renderRow(item)}
        </li>
      ))}
    </ul>
  );

const VirtualRows = <T,>({ items, getKey, renderRow }: RowListProps<T>) => {
  const [scrollMargin, setScrollMargin] = useState(0);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    scrollMargin,
    getItemKey: (index) => {
      const item = items[index];
      return item === undefined ? index : getKey(item);
    },
  });

  // The list scrolls with the page, so the virtualiser needs to know how far down the page the list starts.
  function handleListRef(element: HTMLUListElement | null) {
    if (element) setScrollMargin(element.getBoundingClientRect().top + window.scrollY);
  }

  return (
    <ul ref={handleListRef} className='relative' style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        if (item === undefined) return null;
        return (
          <li
            key={virtualRow.key}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            aria-setsize={items.length}
            aria-posinset={virtualRow.index + 1}
            className={cx('absolute top-0 left-0 w-full', ROW_GAP_CLASS)}
            style={{
              transform: `translateY(${String(virtualRow.start - virtualizer.options.scrollMargin)}px)`,
            }}
          >
            {renderRow(item)}
          </li>
        );
      })}
    </ul>
  );
};
