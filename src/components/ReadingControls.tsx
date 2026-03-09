'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReadingControls() {
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    const stored = localStorage.getItem('fontSize');
    if (stored) setFontSize(Number(stored));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--reading-font-size', `${fontSize}px`);
    localStorage.setItem('fontSize', String(fontSize));
  }, [fontSize]);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b border-border bg-white text-sm">
      <Link href="/" className="text-muted hover:text-foreground transition-colors">
        &larr; New Article
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setFontSize((s) => Math.max(14, s - 2))}
          className="px-2 py-1 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Decrease font size"
        >
          A&minus;
        </button>
        <button
          onClick={() => setFontSize((s) => Math.min(28, s + 2))}
          className="px-2 py-1 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Increase font size"
        >
          A+
        </button>
      </div>
    </div>
  );
}
