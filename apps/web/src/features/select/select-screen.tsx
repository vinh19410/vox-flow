import { PageHead } from "@/layouts/page-head";

import { ModeGrid } from "./components/mode-grid";
import { PreExamCard } from "./components/pre-exam-card";
import { VoicePicker } from "./components/voice-picker";

export function SelectScreen() {
  return (
    <>
      <PageHead
        eyebrow="S07 · Thi thử"
        title="Chọn bài thi"
        sub="Câu hỏi lấy từ ngân hàng đề quý này. Giám khảo sẽ hỏi nối tiếp dựa trên câu trả lời của bạn."
      />

      <ModeGrid />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <VoicePicker />
        <PreExamCard />
      </div>
    </>
  );
}
