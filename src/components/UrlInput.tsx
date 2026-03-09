'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function UrlInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a URL');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    router.push(`/read?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.spiegel.de/..."
          className="flex-1 px-4 py-3 border border-border rounded-lg bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-foreground text-background rounded-lg text-base font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Read
        </button>
      </div>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </form>
  );
}
