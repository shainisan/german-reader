export interface SentencePair {
  de: string;
  en: string;
}

export interface Paragraph {
  sentences: SentencePair[];
}

export interface ArticleData {
  title: string;
  titleEn: string;
  siteName: string;
  paragraphs: Paragraph[];
  truncatedAtChar?: number;
  totalChars?: number;
}

export interface ExtractRequest {
  url: string;
}

export interface ExtractResponse {
  success: true;
  data: ArticleData;
}

export interface ExtractError {
  success: false;
  error: string;
}
