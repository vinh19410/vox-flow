export type TranscribeOptions = {
  audioBuffer: ArrayBuffer | Uint8Array;
  mimeType: string;
  apiKey?: string;
};

export async function transcribeAudio(options: TranscribeOptions): Promise<{ text: string }> {
  const { audioBuffer, mimeType, apiKey } = options;

  if (!apiKey) {
    return {
      text: "I live in an apartment in the city center. It is convenient and close to work, but quite noisy at night.",
    };
  }

  try {
    const filename = mimeType.includes("mp4") ? "audio.mp4" : "audio.webm";
    const blob = new Blob([audioBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("Transcription API non-OK:", res.status, err);
      return { text: "" };
    }

    const data = (await res.json()) as { text?: string };
    return { text: data.text ?? "" };
  } catch (err) {
    console.warn("Transcription failed:", err);
    return { text: "" };
  }
}
