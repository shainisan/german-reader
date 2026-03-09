'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import type { ArticleData, Paragraph, ExtractResponse, ExtractError } from '@/lib/types';
import BilingualReader from '@/components/BilingualReader';
import ReadingControls from '@/components/ReadingControls';
import Link from 'next/link';

function ReadPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [meta, setMeta] = useState<{ title: string; titleEn: string; siteName: string } | null>(null);
  const [truncatedAtChar, setTruncatedAtChar] = useState<number | undefined>();
  const [totalChars, setTotalChars] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      return;
    }

    async function fetchArticle() {
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const json: ExtractResponse | ExtractError = await res.json();

        if (json.success) {
          setMeta({ title: json.data.title, titleEn: json.data.titleEn, siteName: json.data.siteName });
          setParagraphs(json.data.paragraphs);
          setTruncatedAtChar(json.data.truncatedAtChar);
          setTotalChars(json.data.totalChars ?? 0);
        } else {
          setError(json.error);
        }
      } catch {
        setError('Failed to process article. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [url]);

  const handleLoadMore = useCallback(async () => {
    if (!url || truncatedAtChar === undefined || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, charOffset: truncatedAtChar }),
      });

      const json: ExtractResponse | ExtractError = await res.json();

      if (json.success) {
        setParagraphs((prev) => [...prev, ...json.data.paragraphs]);
        setTruncatedAtChar(json.data.truncatedAtChar);
      }
    } catch {
      // silently fail, user can try again
    } finally {
      setLoadingMore(false);
    }
  }, [url, truncatedAtChar, loadingMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <p className="text-muted">Processing article...</p>
          <p className="text-muted text-sm">Extracting content and translating sentences</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="text-red-600 text-lg">{error}</p>
          <Link
            href="/"
            className="inline-block text-muted hover:text-black transition-colors"
          >
            &larr; Try another article
          </Link>
        </div>
      </div>
    );
  }

  if (!meta) return null;

  const data: ArticleData = {
    ...meta,
    paragraphs,
    truncatedAtChar,
    totalChars,
  };

  return (
    <div className="flex flex-col h-screen">
      <ReadingControls />
      <BilingualReader
        data={data}
        onLoadMore={truncatedAtChar !== undefined ? handleLoadMore : undefined}
        loadingMore={loadingMore}
      />
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        </div>
      }
    >
      <ReadPageContent />
    </Suspense>
  );
}
