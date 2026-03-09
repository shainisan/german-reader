import { NextResponse } from 'next/server';
import { extractArticle } from '@/lib/extractor';
import { segmentParagraph } from '@/lib/segmenter';
import { translateBatch, translateText } from '@/lib/translator';
import type { ArticleData, Paragraph, ExtractResponse, ExtractError } from '@/lib/types';

// Vercel free tier allows up to 60s for serverless functions
export const maxDuration = 60;

const DEFAULT_CHAR_LIMIT = 2000;

function truncateParagraphs(
  segmented: string[][],
  charLimit: number
): { paragraphs: string[][]; truncatedAtChar: number | undefined; totalChars: number } {
  const totalChars = segmented.reduce(
    (sum, para) => sum + para.reduce((s, sent) => s + sent.length, 0),
    0
  );

  if (totalChars <= charLimit) {
    return { paragraphs: segmented, truncatedAtChar: undefined, totalChars };
  }

  const result: string[][] = [];
  let charCount = 0;

  for (const para of segmented) {
    const paraSentences: string[] = [];
    for (const sentence of para) {
      if (charCount + sentence.length > charLimit && charCount > 0) {
        if (paraSentences.length > 0) result.push(paraSentences);
        return { paragraphs: result, truncatedAtChar: charCount, totalChars };
      }
      paraSentences.push(sentence);
      charCount += sentence.length;
    }
    if (paraSentences.length > 0) result.push(paraSentences);
  }

  return { paragraphs: result, truncatedAtChar: undefined, totalChars };
}

export async function POST(
  request: Request
): Promise<NextResponse<ExtractResponse | ExtractError>> {
  try {
    const body = await request.json();
    const { url, charOffset } = body;
    const charLimit: number = body.charLimit ?? DEFAULT_CHAR_LIMIT;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
    }

    // Extract article — returns pre-split paragraphs from HTML structure
    const article = await extractArticle(url);

    // Segment each paragraph into sentences
    const allSegmented = article.paragraphs
      .map((para) => segmentParagraph(para))
      .filter((sentences) => sentences.length > 0);

    if (allSegmented.flat().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No content could be extracted from this article' },
        { status: 422 }
      );
    }

    // If charOffset is provided, skip ahead to that point
    let segmentedToProcess = allSegmented;
    if (typeof charOffset === 'number' && charOffset > 0) {
      let skipped = 0;
      const remaining: string[][] = [];
      let skipping = true;
      for (const para of allSegmented) {
        if (!skipping) {
          remaining.push(para);
          continue;
        }
        const paraSentences: string[] = [];
        for (const sentence of para) {
          if (skipping) {
            if (skipped + sentence.length <= charOffset) {
              skipped += sentence.length;
              continue;
            }
            skipping = false;
          }
          paraSentences.push(sentence);
        }
        if (paraSentences.length > 0) remaining.push(paraSentences);
      }
      segmentedToProcess = remaining;
    }

    // Truncate to charLimit
    const { paragraphs: truncated, truncatedAtChar, totalChars } = truncateParagraphs(
      segmentedToProcess,
      charLimit
    );

    const allSentences = truncated.flat();

    // Translate all sentences + title (only translate title on first load)
    const translateTitle = !charOffset;
    const [translations, titleEn] = await Promise.all([
      translateBatch(allSentences),
      translateTitle ? translateText(article.title) : Promise.resolve(''),
    ]);

    // Reconstruct paragraphs with translations
    let sentenceIndex = 0;
    const paragraphs: Paragraph[] = truncated.map((paraSentences) => ({
      sentences: paraSentences.map((de) => ({
        de,
        en: translations[sentenceIndex++] || '[Translation unavailable]',
      })),
    }));

    const data: ArticleData = {
      title: article.title,
      titleEn: titleEn || '',
      siteName: article.siteName,
      paragraphs,
      truncatedAtChar: truncatedAtChar !== undefined ? (charOffset ?? 0) + truncatedAtChar : undefined,
      totalChars,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Extract API error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
