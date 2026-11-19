'use client';

import { type ChangeEvent, useId, useRef, useState } from 'react';
import { Button } from '@eylulg/ui/button';
import { Download, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { panelClass, panelTitleClass } from '@/components/app/styles';
import type { WatchlistItem } from '@/lib/watchlist/schema';
import { watchlistActions } from '@/lib/watchlist/store';
import { buildExportFile, parseImportFile } from '@/lib/watchlist/transfer';

interface Message {
  tone: 'success' | 'error';
  text: string;
}

const MAX_IMPORT_BYTES = 2_000_000;

export const ImportExport = ({ items }: { items: WatchlistItem[] }) => {
  const t = useTranslations('ImportExport');
  const [message, setMessage] = useState<Message | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  /** Counts imports, so a slow file read cannot overwrite the result of a newer one. */
  const latestImport = useRef(0);
  const inputId = useId();

  function handleExport() {
    const blob = new Blob([buildExportFile(items, new Date())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleChooseFile() {
    fileInput.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ tone: 'error', text: t('tooLarge') });
      return;
    }
    latestImport.current += 1;
    const importId = latestImport.current;
    file.text().then(
      (text) => {
        if (importId !== latestImport.current) return;
        const result = parseImportFile(text);
        if (!result) {
          setMessage({ tone: 'error', text: t('invalid') });
          return;
        }
        watchlistActions.merge(result.items);
        setMessage({
          tone: 'success',
          text: t('imported', { count: result.items.length, skipped: result.skipped }),
        });
      },
      () => {
        if (importId === latestImport.current) setMessage({ tone: 'error', text: t('invalid') });
      },
    );
  }

  return (
    <section aria-labelledby='import-export' className={panelClass}>
      <h2 id='import-export' className={panelTitleClass}>
        {t('title')}
      </h2>
      <p className='text-sm text-tertiary'>{t('description')}</p>
      <div className='flex flex-wrap gap-3'>
        <Button
          variant='secondary'
          size='md'
          iconLeading={Download}
          isDisabled={items.length === 0}
          onPress={handleExport}
        >
          {t('export')}
        </Button>
        <Button variant='secondary' size='md' iconLeading={Upload} onPress={handleChooseFile}>
          {t('import')}
        </Button>
        <label htmlFor={inputId} className='sr-only'>
          {t('fileLabel')}
        </label>
        <input
          ref={fileInput}
          id={inputId}
          type='file'
          accept='application/json,.json'
          tabIndex={-1}
          className='sr-only'
          onChange={handleFileChange}
        />
      </div>
      <p
        role='status'
        aria-live='polite'
        className={message?.tone === 'error' ? 'text-sm text-error' : 'text-sm text-success'}
      >
        {message?.text}
      </p>
    </section>
  );
};
