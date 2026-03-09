import translate from 'google-translate-api-x';

const BATCH_SIZE = 10;
const BATCH_DELAY = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateBatch(sentences: string[]): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    if (i > 0) {
      await delay(BATCH_DELAY);
    }

    const batch = sentences.slice(i, i + BATCH_SIZE);

    try {
      const res = await translate(batch, { from: 'de', to: 'en' });
      const translations = Array.isArray(res) ? res : [res];
      results.push(...translations.map((t) => t.text));
    } catch (error: unknown) {
      // Retry with gtx client on 403
      if (error instanceof Error && error.message?.includes('403')) {
        console.warn('Got 403, retrying batch with gtx client...');
        await delay(500);
        try {
          const retryResults = await translateSentencesOneByOne(batch);
          results.push(...retryResults);
        } catch {
          results.push(...batch.map(() => '[Translation unavailable]'));
        }
      } else {
        console.error('Translation error:', error);
        results.push(...batch.map(() => '[Translation unavailable]'));
      }
    }
  }

  return results;
}

async function translateSentencesOneByOne(sentences: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const sentence of sentences) {
    try {
      await delay(500);
      const res = await translate(sentence, {
        from: 'de',
        to: 'en',
        forceBatch: false,
      } as Parameters<typeof translate>[1]);
      const single = Array.isArray(res) ? res[0] : res;
      results.push(single.text);
    } catch {
      results.push('[Translation unavailable]');
    }
  }
  return results;
}

export async function translateText(text: string): Promise<string> {
  try {
    const res = await translate(text, { from: 'de', to: 'en' });
    const single = Array.isArray(res) ? res[0] : res;
    return single.text;
  } catch {
    return '[Translation unavailable]';
  }
}
