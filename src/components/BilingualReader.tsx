'use client';

import { useState, useCallback } from 'react';
import type { ArticleData } from '@/lib/types';
import { useSyncScroll } from '@/hooks/useSyncScroll';
import SentenceSpan from './SentencePair';

interface BilingualReaderProps {
  data: ArticleData;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

function ShowMoreButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="py-6 text-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="px-5 py-2 border border-border text-sm text-muted hover:text-black hover:border-black transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Show more'}
      </button>
    </div>
  );
}

export default function BilingualReader({ data, onLoadMore, loadingMore }: BilingualReaderProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { leftRef, rightRef } = useSyncScroll();

  const handleHover = useCallback((id: string | null) => {
    setHighlightedId(id);
  }, []);

  const readingStyle = {
    fontSize: 'var(--reading-font-size, 18px)',
    lineHeight: '1.8',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Title */}
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-2xl font-bold leading-snug">{data.title}</h1>
        <p className="text-muted text-base mt-1">{data.titleEn}</p>
        <p className="text-muted text-sm mt-2">{data.siteName}</p>
      </div>

      {/* Desktop: side-by-side panes */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* German pane */}
        <div
          ref={leftRef}
          className="w-1/2 overflow-y-auto p-6 border-r border-border"
          style={readingStyle}
        >
          {data.paragraphs.map((para, pIdx) => (
            <p key={pIdx} className="mb-5">
              {para.sentences.map((s, sIdx) => {
                const id = `p${pIdx}-s${sIdx}`;
                return (
                  <SentenceSpan
                    key={id}
                    id={id}
                    text={s.de}
                    onHover={handleHover}
                    isHighlighted={highlightedId === id}
                  />
                );
              })}
            </p>
          ))}
          {onLoadMore && (
            <ShowMoreButton onClick={onLoadMore} loading={!!loadingMore} />
          )}
        </div>

        {/* English pane */}
        <div
          ref={rightRef}
          className="w-1/2 overflow-y-auto p-6"
          style={readingStyle}
        >
          {data.paragraphs.map((para, pIdx) => (
            <p key={pIdx} className="mb-5">
              {para.sentences.map((s, sIdx) => {
                const id = `p${pIdx}-s${sIdx}`;
                return (
                  <SentenceSpan
                    key={id}
                    id={id}
                    text={s.en}
                    onHover={handleHover}
                    isHighlighted={highlightedId === id}
                  />
                );
              })}
            </p>
          ))}
          {onLoadMore && (
            <ShowMoreButton onClick={onLoadMore} loading={!!loadingMore} />
          )}
        </div>
      </div>

      {/* Mobile: interleaved paragraphs */}
      <div className="md:hidden flex-1 overflow-y-auto p-4" style={readingStyle}>
        {data.paragraphs.map((para, pIdx) => (
          <div key={pIdx} className="mb-6">
            <p className="mb-2">
              {para.sentences.map((s, sIdx) => {
                const id = `p${pIdx}-s${sIdx}`;
                return (
                  <SentenceSpan
                    key={`de-${id}`}
                    id={id}
                    text={s.de}
                    onHover={handleHover}
                    isHighlighted={highlightedId === id}
                  />
                );
              })}
            </p>
            <p className="text-muted">
              {para.sentences.map((s, sIdx) => {
                const id = `p${pIdx}-s${sIdx}`;
                return (
                  <SentenceSpan
                    key={`en-${id}`}
                    id={id}
                    text={s.en}
                    onHover={handleHover}
                    isHighlighted={highlightedId === id}
                  />
                );
              })}
            </p>
          </div>
        ))}
        {onLoadMore && (
          <ShowMoreButton onClick={onLoadMore} loading={!!loadingMore} />
        )}
      </div>
    </div>
  );
}
