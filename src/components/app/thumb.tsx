import { cx } from '@eylulg/ui/cx';
import Image from 'next/image';
import { Film } from '@/components/app/icons';
import { tmdbImage } from '@/lib/tmdb/images';

interface ThumbProps {
  path: string | null;
  /** Width and corner radius, for example `w-12 rounded-md`. */
  className: string;
  /** A 16:9 still instead of a 2:3 poster. */
  isWide?: boolean;
  /** The `sizes` hint for the image, matching the width in `className`. */
  sizes: string;
  imageSize?: Parameters<typeof tmdbImage>[1];
}

/** A small decorative image in a list row. Shows a film icon when TMDB has no image, so a gap reads as missing. */
export const Thumb = ({
  path,
  className,
  sizes,
  isWide = false,
  imageSize = 'w185',
}: ThumbProps) => (
  <div
    className={cx(
      'relative shrink-0 overflow-hidden bg-tertiary',
      isWide ? 'aspect-video' : 'aspect-2/3',
      className,
    )}
  >
    {path ? (
      <Image src={tmdbImage(path, imageSize)} alt='' fill sizes={sizes} className='object-cover' />
    ) : (
      <Film aria-hidden='true' className='absolute inset-0 m-auto size-1/3 text-fg-tertiary' />
    )}
  </div>
);
