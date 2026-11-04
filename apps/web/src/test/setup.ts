import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  try {
    globalThis.sessionStorage?.clear();
  } catch {
    // ignore storage errors in restricted environments
  }
});

if (typeof window !== "undefined") {
  window.scrollTo = () => {};

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
}

if (typeof globalThis.SpeechSynthesisUtterance === "undefined") {
  class MockSpeechSynthesisUtterance {
    text: string;
    lang = "en-US";
    rate = 1;
    onend: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
}

if (typeof globalThis.speechSynthesis === "undefined") {
  (globalThis as Record<string, unknown>).speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [],
    speaking: false,
    pending: false,
    paused: false,
  };
}

if (typeof globalThis.AudioContext === "undefined") {
  class MockAudioContext {
    createAnalyser() {
      return {
        fftSize: 512,
        getByteTimeDomainData: (buf: Uint8Array) => buf.fill(128),
      };
    }
    createMediaStreamSource() {
      return { connect: () => {} };
    }
    close() {
      return Promise.resolve();
    }
  }
  (globalThis as Record<string, unknown>).AudioContext = MockAudioContext;
}
