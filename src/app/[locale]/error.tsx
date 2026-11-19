'use client';

import { Button } from '@eylulg/ui/button';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/app/states';

/** Next passes `error` too; its message is not shown because it can carry server details. */
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('Errors');

  return (
    <ErrorState
      title={t('pageTitle')}
      headingLevel={1}
      message={t('pageMessage')}
      actions={
        <Button size='md' onPress={reset}>
          {t('retry')}
        </Button>
      }
    />
  );
}
