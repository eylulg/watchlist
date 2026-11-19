import { ImageResponse } from 'next/og';

/**
 * PWA and touch icons, drawn at build time so no binary files live in the repo.
 * Maskable icons keep the mark inside the central 80% safe zone.
 */
const ICONS = {
  'icon-192.png': { size: 192, maskable: false },
  'icon-512.png': { size: 512, maskable: false },
  'maskable-512.png': { size: 512, maskable: true },
  'apple-touch-icon.png': { size: 180, maskable: true },
} as const;

type IconFile = keyof typeof ICONS;

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(ICONS).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!(file in ICONS)) return new Response('Not found', { status: 404 });
  const { size, maskable } = ICONS[file as IconFile];
  const mark = Math.round(size * (maskable ? 0.5 : 0.6));

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#7f56d9',
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
      }}
    >
      <svg width={mark} height={mark} viewBox='0 0 16 16' fill='#ffffff'>
        <path d='M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.9l-4.02 2.94a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5z' />
      </svg>
    </div>,
    { width: size, height: size },
  );
}
