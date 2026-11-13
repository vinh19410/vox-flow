import { ENV } from "../env.public";

function getServerBaseUrl(): string {
  return (ENV.VITE_SERVER_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Deterministic 32-bit FNV-1a hex fingerprint over whitespace-normalized text.
 * Appended as `?v=<hex>` so browsers bust HTTP cache when an Admin edits
 * question wording, while the server still resolves text from its canonical bank/DB.
 */
export function shortTextFingerprint(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildPreviewTtsUrl(voiceId: string): string {
  return `${getServerBaseUrl()}/api/tts/preview/${encodeURIComponent(voiceId)}`;
}

export function buildMockTtsUrl(voiceId: string, questionKey: string, text?: string): string {
  const base = `${getServerBaseUrl()}/api/tts/mock/${encodeURIComponent(voiceId)}/${encodeURIComponent(questionKey)}`;
  if (text && text.trim().length > 0) {
    return `${base}?v=${shortTextFingerprint(text)}`;
  }
  return base;
}

export function buildForecastTtsUrl(
  voiceId: string,
  topicId: string,
  questionKey: string,
  text?: string,
): string {
  const base = `${getServerBaseUrl()}/api/tts/forecast/${encodeURIComponent(voiceId)}/${encodeURIComponent(topicId)}/${encodeURIComponent(questionKey)}`;
  if (text && text.trim().length > 0) {
    return `${base}?v=${shortTextFingerprint(text)}`;
  }
  return base;
}
