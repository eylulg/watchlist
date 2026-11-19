'use client';

import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { IconButton } from '@eylulg/ui/icon-button';
import { Skeleton } from '@eylulg/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { sectionTitleClass } from './styles';

interface CarouselProps {
  title: string;
  /** `<li>` elements, each holding one card whose title is a link (`data-card-action`). */
  children: ReactNode;
}

const NAVIGATION_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

const nextIndex = (key: string, index: number, count: number) => {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return Math.max(0, Math.min(count - 1, index + (key === 'ArrowRight' ? 1 : -1)));
};

function measureEdges(list: HTMLElement) {
  return {
    atStart: list.scrollLeft <= 1,
    atEnd: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
  };
}

/**
 * A horizontally scrolling row of cards. Every card stays in the tab order; Left and Right arrows move
 * between cards, Home and End jump to the ends, and the buttons scroll by one view for pointer users.
 */
export const Carousel = ({ title, children }: CarouselProps) => {
  const t = useTranslations('Common');
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
  const headingId = useId();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      setEdges(measureEdges(list));
    });
    observer.observe(list);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Arrow keys come from the focused card links; listening on the list handles them all in one place.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (!list || !NAVIGATION_KEYS.has(event.key)) return;
      const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-card-action]'));
      const index = cards.findIndex((card) => card === document.activeElement);
      const target = cards[nextIndex(event.key, index, cards.length)];
      if (index === -1 || !target) return;
      event.preventDefault();
      target.focus();
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    list.addEventListener('keydown', handleKeyDown);
    return () => {
      list.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const list = listRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({
      left: direction * list.clientWidth * 0.9,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  function handleScrollLeft() {
    scrollByPage(-1);
  }

  function handleScrollRight() {
    scrollByPage(1);
  }

  function handleScroll() {
    if (listRef.current) setEdges(measureEdges(listRef.current));
  }

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 id={headingId} className={sectionTitleClass}>
          {title}
        </h2>
        <div className='flex items-center gap-2'>
          <IconButton
            aria-label={t('scrollLeft', { title })}
            aria-controls={listId}
            variant='secondary'
            size='sm'
            icon={ChevronLeft}
            isDisabled={edges.atStart}
            onPress={handleScrollLeft}
          />
          <IconButton
            aria-label={t('scrollRight', { title })}
            aria-controls={listId}
            variant='secondary'
            size='sm'
            icon={ChevronRight}
            isDisabled={edges.atEnd}
            onPress={handleScrollRight}
          />
        </div>
      </div>
      <ul
        id={listId}
        ref={listRef}
        onScroll={handleScroll}
        className='-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-3 md:mx-0 md:scroll-px-0 md:px-0 [&>li]:w-36 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-44'
      >
        {children}
      </ul>
    </section>
  );
};

export const CarouselSkeleton = ({ title }: { title: string }) => {
  const t = useTranslations('Common');
  return (
    <section aria-busy='true' className='flex flex-col gap-4'>
      <h2 className={sectionTitleClass}>{title}</h2>
      <span className='sr-only'>{t('loading')}</span>
      <div aria-hidden='true' className='flex gap-4 overflow-hidden pb-3'>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className='flex w-36 shrink-0 flex-col gap-2 sm:w-44'>
            <Skeleton shape='rect' className='aspect-2/3 h-auto rounded-xl' />
            <Skeleton className='w-4/5' />
          </div>
        ))}
      </div>
    </section>
  );
};
