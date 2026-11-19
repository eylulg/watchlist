'use client';

import { useEffect, useState } from 'react';

const RESET_MS = 2000;

/** Copies text with the async Clipboard API and reports `copied` for two seconds afterwards. */
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
    }, RESET_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  async function copy(text: string): Promise<{ success: boolean }> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  return { copy, copied };
};
