import { PageHead } from "@/layouts/page-head";

import { ModeGrid } from "./components/mode-grid";
import { PreExamCard } from "./components/pre-exam-card";
import { VoicePicker } from "./components/voice-picker";
import { useSelectMobileViewport } from "./use-select-mobile-viewport";

export function SelectScreen() {
  const isMobileViewport = useSelectMobileViewport();

  return (
    <>
      <PageHead
        eyebrow="S07 · Thi thử"
        title="Chọn bài thi"
        sub="Câu hỏi lấy từ ngân hàng đề quý này. Giám khảo sẽ hỏi nối tiếp dựa trên câu trả lời của bạn."
      />

      <ModeGrid />

      {!isMobileViewport && (
        <div className="mt-5 hidden gap-5 lg:grid lg:grid-cols-[1.4fr_1fr]">
          <VoicePicker />
          <PreExamCard />
        </div>
      )}
    </>
  );
}
