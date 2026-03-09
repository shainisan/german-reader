'use client';

import { useRef, useEffect, useCallback } from 'react';

export function useSyncScroll() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const sourceEl = source === 'left' ? leftRef.current : rightRef.current;
    const targetEl = source === 'left' ? rightRef.current : leftRef.current;

    if (sourceEl && targetEl) {
      const scrollPercent =
        sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);
      targetEl.scrollTop =
        scrollPercent * (targetEl.scrollHeight - targetEl.clientHeight);
    }

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;

    const onLeftScroll = () => handleScroll('left');
    const onRightScroll = () => handleScroll('right');

    leftEl?.addEventListener('scroll', onLeftScroll, { passive: true });
    rightEl?.addEventListener('scroll', onRightScroll, { passive: true });

    return () => {
      leftEl?.removeEventListener('scroll', onLeftScroll);
      rightEl?.removeEventListener('scroll', onRightScroll);
    };
  }, [handleScroll]);

  return { leftRef, rightRef };
}
