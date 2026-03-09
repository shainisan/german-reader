import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

interface ExtractedArticle {
  title: string;
  paragraphs: string[];
  siteName: string;
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content?.trim()) {
    throw new Error(
      'Could not extract article content. The page may require JavaScript, be behind a paywall, or not contain article content.'
    );
  }

  // Parse the Readability HTML output to extract paragraphs from block elements
  const contentDom = new JSDOM(article.content);
  const doc = contentDom.window.document;

  // Collect text from block-level elements that represent paragraphs
  const blockTags = ['P', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const blocks = doc.querySelectorAll(blockTags.join(','));

  const paragraphs: string[] = [];

  if (blocks.length > 0) {
    blocks.forEach((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) paragraphs.push(text);
    });
  }

  // Fallback: if no block elements found, split textContent on double newlines
  if (paragraphs.length === 0) {
    const fallback = (article.textContent || '')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 0);
    paragraphs.push(...fallback);
  }

  if (paragraphs.length === 0) {
    throw new Error('No content could be extracted from this article.');
  }

  return {
    title: article.title || 'Untitled',
    paragraphs,
    siteName: article.siteName || new URL(url).hostname,
  };
}
