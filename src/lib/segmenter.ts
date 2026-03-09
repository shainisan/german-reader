const PLACEHOLDER = '\u0000';

// German abbreviations that end with a period but don't end a sentence
const ABBREVIATIONS = [
  // Titles
  'Dr', 'Prof', 'Hr', 'Fr', 'St', 'Ing',
  // Common abbreviations
  'bzw', 'ca', 'evtl', 'ggf', 'inkl', 'max', 'min', 'nr', 'Nr',
  'sog', 'Tel', 'usw', 'vgl', 'Vol', 'vs',
  // Multi-part abbreviations (we protect the individual parts)
  'z', 'B', 'd', 'h', 'u', 'a', 'o', 'Ä', 'i', 'S', 'v', 'Chr',
  'Mio', 'Mrd', 'Std', 'Mi', 'Mo', 'Di', 'Do', 'Fr', 'Sa', 'So',
  'Jan', 'Feb', 'Mär', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

function protectAbbreviations(text: string): string {
  let result = text;

  // Protect known abbreviations: "Dr." -> "Dr\0"
  for (const abbr of ABBREVIATIONS) {
    const regex = new RegExp(`\\b${abbr}\\.`, 'g');
    result = result.replace(regex, abbr + PLACEHOLDER);
  }

  // Protect ordinal numbers before lowercase words (e.g., "am 3. März" won't split, but lowercase like "am 3. tag")
  result = result.replace(/(\d+)\.(?=\s+[a-zäöü])/g, `$1${PLACEHOLDER}`);

  // Protect ordinal numbers before month names (e.g., "31. Dezember")
  result = result.replace(
    /(\d+)\.(?=\s+(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember))/g,
    `$1${PLACEHOLDER}`
  );

  // Protect decimal numbers with German formatting (1.000 or 1.000,50)
  result = result.replace(/(\d)\.(\d)/g, `$1${PLACEHOLDER}$2`);

  // Protect ellipsis
  result = result.replace(/\.{3}/g, PLACEHOLDER.repeat(3));

  return result;
}

function restorePlaceholders(text: string): string {
  return text.replace(new RegExp(PLACEHOLDER, 'g'), '.');
}

function segmentSentences(text: string): string[] {
  // First, normalize: insert space after sentence-ending punctuation when directly
  // followed by an uppercase letter (e.g. "Stimmen.Alles" -> "Stimmen. Alles")
  let normalized = text.replace(/([.!?])([A-ZÄÖÜ])/g, '$1 $2');

  // Also handle "word."word" or "word."Word patterns (quote then uppercase)
  normalized = normalized.replace(/([.!?])(["„»«'"])([A-ZÄÖÜ])/g, '$1$2 $3');

  const protected_ = protectAbbreviations(normalized);

  // Split on sentence-ending punctuation followed by whitespace and an uppercase letter
  // Also handle punctuation followed by quotes then whitespace then uppercase
  const parts = protected_.split(/(?<=[.!?]["„»«'"]?)\s+(?=[A-ZÄÖÜ"„»«'"])/);

  return parts
    .map((s) => restorePlaceholders(s).trim())
    .filter((s) => s.length > 0);
}

export function segmentParagraph(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  return segmentSentences(cleaned);
}

export function segmentIntoParagraphs(text: string): string[][] {
  // Split on double newlines (paragraph boundaries)
  const rawParagraphs = text.split(/\n\s*\n/);

  return rawParagraphs
    .map((para) => segmentParagraph(para))
    .filter((sentences) => sentences.length > 0);
}
