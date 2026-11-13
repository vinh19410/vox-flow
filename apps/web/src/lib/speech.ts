export interface SpeakOptions {
  audioUrl?: string;
  lang?: string;
  rate?: number;
  onEnd?: () => void;
}

const MAX_PREFETCH_ENTRIES = 32;
const prefetchCache = new Map<string, Promise<Blob>>();
const prefetchControllers = new Map<string, AbortController>();

let speechGeneration = 0;
let activeAbortController: AbortController | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;

function cleanupActiveAudio(): void {
  if (activeAudio !== null) {
    const audio = activeAudio;
    activeAudio = null;
    try {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute?.("src");
    } catch {
      // Audio element cleanup may fail in restricted or mocked environments
    }
  }
  if (activeObjectUrl !== null) {
    const url = activeObjectUrl;
    activeObjectUrl = null;
    try {
      if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(url);
      }
    } catch {
      // Object URL revocation unavailable or failed
    }
  }
}

function abortActiveFetch(): void {
  if (activeAbortController !== null) {
    const controller = activeAbortController;
    activeAbortController = null;
    try {
      controller.abort();
    } catch {
      // Ignore abort errors
    }
  }
}

function insertCachePromise(audioUrl: string, promise: Promise<Blob>): void {
  if (prefetchCache.has(audioUrl)) {
    prefetchCache.delete(audioUrl);
  }
  while (prefetchCache.size >= MAX_PREFETCH_ENTRIES) {
    const oldestKey = prefetchCache.keys().next().value;
    if (oldestKey === undefined) break;
    prefetchCache.delete(oldestKey);
    prefetchControllers.delete(oldestKey);
  }
  prefetchCache.set(audioUrl, promise);
}

function fetchOrReuseAudioBlob(
  audioUrl: string,
  controller: AbortController,
  trackAsPrefetch: boolean,
): Promise<Blob | null> {
  const existing = prefetchCache.get(audioUrl);
  if (existing !== undefined) {
    prefetchCache.delete(audioUrl);
    prefetchCache.set(audioUrl, existing);
    return existing.then(
      (blob) => blob,
      () => null,
    );
  }

  if (typeof globalThis.fetch !== "function") {
    return Promise.resolve(null);
  }

  if (trackAsPrefetch) {
    prefetchControllers.set(audioUrl, controller);
  }

  const blobPromise = (async (): Promise<Blob> => {
    const res = await globalThis.fetch(audioUrl, {
      signal: controller.signal,
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`TTS HTTP ${res.status}`);
    }
    const blob = await res.blob();
    if (!blob || blob.size <= 0) {
      throw new Error("Empty TTS audio blob");
    }
    return blob;
  })();

  insertCachePromise(audioUrl, blobPromise);

  return blobPromise.then(
    (blob) => {
      if (prefetchControllers.get(audioUrl) === controller) {
        prefetchControllers.delete(audioUrl);
      }
      return blob;
    },
    () => {
      if (prefetchCache.get(audioUrl) === blobPromise) {
        prefetchCache.delete(audioUrl);
      }
      if (prefetchControllers.get(audioUrl) === controller) {
        prefetchControllers.delete(audioUrl);
      }
      return null;
    },
  );
}

function speakWithBrowserSynthesis(text: string, opts?: SpeakOptions): void {
  try {
    if (
      typeof globalThis.speechSynthesis === "undefined" ||
      typeof globalThis.SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }
    const u = new globalThis.SpeechSynthesisUtterance(text);
    if (opts?.lang !== undefined) {
      u.lang = opts.lang;
    }
    if (opts?.rate !== undefined) {
      u.rate = opts.rate;
    }
    if (opts?.onEnd !== undefined) {
      const handleEnd = opts.onEnd;
      u.onend = () => {
        handleEnd();
      };
    }
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.speak(u);
  } catch {
    // Web Speech API unavailable or restricted
  }
}

export function prefetchSpeech(audioUrl: string): Promise<Blob | null> {
  if (!audioUrl) {
    return Promise.resolve(null);
  }
  const controller = new AbortController();
  return fetchOrReuseAudioBlob(audioUrl, controller, true);
}

export function clearSpeechPrefetchCache(): void {
  for (const controller of prefetchControllers.values()) {
    try {
      controller.abort();
    } catch {
      // Ignore abort errors
    }
  }
  prefetchControllers.clear();
  prefetchCache.clear();
}

export function cancelSpeech(): void {
  speechGeneration += 1;
  abortActiveFetch();
  cleanupActiveAudio();
  try {
    if (typeof globalThis.speechSynthesis !== "undefined") {
      globalThis.speechSynthesis.cancel();
    }
  } catch {
    // Web Speech API unavailable or restricted
  }
}

async function playRemoteSpeech(
  text: string,
  audioUrl: string,
  opts: SpeakOptions | undefined,
  myGen: number,
): Promise<void> {
  const controller = new AbortController();
  const inFlightPrefetchController = prefetchControllers.get(audioUrl);
  activeAbortController = inFlightPrefetchController ?? controller;

  const blob = await fetchOrReuseAudioBlob(audioUrl, controller, false);

  if (
    activeAbortController === controller ||
    activeAbortController === inFlightPrefetchController
  ) {
    activeAbortController = null;
  }

  if (myGen !== speechGeneration) {
    return;
  }

  if (
    blob === null ||
    typeof globalThis.Audio === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    speakWithBrowserSynthesis(text, opts);
    return;
  }

  let audio: HTMLAudioElement;
  try {
    const objectUrl = URL.createObjectURL(blob);
    activeObjectUrl = objectUrl;
    audio = new globalThis.Audio(objectUrl);
    activeAudio = audio;
  } catch {
    cleanupActiveAudio();
    if (myGen === speechGeneration) {
      speakWithBrowserSynthesis(text, opts);
    }
    return;
  }

  let settled = false;

  audio.onended = () => {
    if (settled || myGen !== speechGeneration) return;
    settled = true;
    cleanupActiveAudio();
    opts?.onEnd?.();
  };

  audio.onerror = () => {
    if (settled || myGen !== speechGeneration) return;
    settled = true;
    cleanupActiveAudio();
    speakWithBrowserSynthesis(text, opts);
  };

  try {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (settled || myGen !== speechGeneration) return;
        settled = true;
        cleanupActiveAudio();
        speakWithBrowserSynthesis(text, opts);
      });
    }
  } catch {
    if (!settled && myGen === speechGeneration) {
      settled = true;
      cleanupActiveAudio();
      speakWithBrowserSynthesis(text, opts);
    }
  }
}

export function speakText(text: string, opts?: SpeakOptions): void {
  const audioUrl = opts?.audioUrl;
  if (!audioUrl) {
    speechGeneration += 1;
    abortActiveFetch();
    cleanupActiveAudio();
    speakWithBrowserSynthesis(text, opts);
    return;
  }

  cancelSpeech();
  const myGen = ++speechGeneration;
  void playRemoteSpeech(text, audioUrl, opts, myGen);
}
