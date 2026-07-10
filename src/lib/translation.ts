import { readJSON, writeJSON } from "./storage";

const translationStorageKey = "sssong-web-translations";

export function getCachedTranslation(lineID: string): string | undefined {
  const cache = readJSON<Record<string, string>>(translationStorageKey, {});
  return cache[lineID];
}

export async function translateLine(lineID: string, text: string, signal?: AbortSignal): Promise<string> {
  const cached = getCachedTranslation(lineID);
  if (cached) {
    return cached;
  }

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "ja|zh-CN");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`翻译接口返回 ${response.status}`);
  }

  const payload = (await response.json()) as {
    responseData?: {
      translatedText?: string;
    };
  };
  const translatedText = payload.responseData?.translatedText?.trim();
  if (!translatedText) {
    throw new Error("翻译结果为空");
  }

  const cache = readJSON<Record<string, string>>(translationStorageKey, {});
  cache[lineID] = translatedText;
  writeJSON(translationStorageKey, cache);
  return translatedText;
}
