'use client';

interface SentenceSpanProps {
  id: string;
  text: string;
  onHover: (id: string | null) => void;
  isHighlighted: boolean;
}

export default function SentenceSpan({
  id,
  text,
  onHover,
  isHighlighted,
}: SentenceSpanProps) {
  return (
    <span
      data-sentence-id={id}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onHover(id)}
      className={`transition-colors duration-150 rounded-sm cursor-default ${
        isHighlighted ? 'bg-highlight' : ''
      }`}
    >
      {text}{' '}
    </span>
  );
}
