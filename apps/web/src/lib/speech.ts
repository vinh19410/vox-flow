export interface SpeakOptions {
  lang?: string;
  rate?: number;
  onEnd?: () => void;
}

export function cancelSpeech(): void {
  try {
    if (typeof globalThis.speechSynthesis !== "undefined") {
      globalThis.speechSynthesis.cancel();
    }
  } catch {
    // Web Speech API unavailable or restricted
  }
}

export function speakText(text: string, opts?: SpeakOptions): void {
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
