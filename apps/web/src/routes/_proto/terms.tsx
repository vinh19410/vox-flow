import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ds/button";
import { useApp } from "@/features/app-state/types";

export const Route = createFileRoute("/_proto/terms")({
  component: TermsRoute,
});

export function TermsRoute() {
  const { go } = useApp();

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <button
          type="button"
          onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? window.history.back() : go("auth"))}
          className="flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className="flex items-center gap-2 text-xs text-subtle">
          <FileText size={14} /> Điều khoản & Chính sách
        </div>
      </header>

      <main className="space-y-8 text-ink">
        <div className="border-b border-line pb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-3 py-1 text-xs font-semibold text-ink-2">
            <ShieldCheck size={14} className="text-brand" /> Cập nhật lần cuối: Tháng 11/2026
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Điều khoản dịch vụ & Chính sách sử dụng
          </h1>
          <p className="mt-3 text-base text-ink-2">
            Chào mừng bạn đến với Vox Flow. Khi đăng ký hoặc sử dụng dịch vụ luyện thi IELTS Speaking của chúng tôi, bạn đồng ý với các điều khoản dưới đây.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Phạm vi dịch vụ</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Vox Flow cung cấp nền tảng thi thử và chấm điểm kỹ năng IELTS Speaking ứng dụng trí tuệ nhân tạo (AI). Điểm số, phản hồi tiêu chí và các phân tích ngữ âm do hệ thống cung cấp mang tính chất tham khảo, giúp học viên định hướng luyện tập và không thay thế kết quả thi chính thức của các đơn vị khảo thí IELTS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Tài khoản và quyền truy cập</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Bạn cam kết cung cấp thông tin chính xác và không chia sẻ tài khoản cho người khác để trục lợi hạn mức thi thử.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. Xử lý và lưu trữ dữ liệu bài làm</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Để thực hiện việc nhận dạng giọng nói, phân tích lỗi phát âm và trả kết quả chấm thi, Vox Flow ghi âm và lưu trữ các đoạn trả lời của bạn trong suốt quá trình làm bài. Các đoạn ghi âm và kết quả chấm điểm được lưu vào lịch sử tài khoản của bạn để phục vụ việc xem lại tiến trình học tập.
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            Dữ liệu âm thanh của bạn được truyền tải qua kết nối bảo mật (HTTPS) và chỉ được xử lý cho mục đích cung cấp tính năng chấm thi, đánh giá phát âm và hỗ trợ phúc khảo (dispute) khi bạn yêu cầu.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Quy định sử dụng hợp lý</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Người dùng cam kết không sử dụng hệ thống vào các mục đích:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-2">
            <li>Ghi âm hoặc tải lên nội dung vi phạm pháp luật, quấy rối, xúc phạm hoặc kích động thù địch.</li>
            <li>Can thiệp, phá hoại hoặc cố ý làm gián đoạn hạ tầng máy chủ, dịch vụ chấm thi của Vox Flow.</li>
            <li>Sử dụng các công cụ tự động hóa trái phép (bot, crawler) để khai thác đề thi hoặc hạn mức miễn phí.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">5. Quyền sở hữu trí tuệ</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Toàn bộ giao diện, thuật toán chấm điểm, hệ thống câu hỏi, đề forecast và tài liệu hướng dẫn trên Vox Flow thuộc quyền sở hữu của Vox Flow. Người dùng giữ quyền sở hữu đối với nội dung phát ngôn cá nhân của mình trong các bài thi thử.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">6. Thay đổi điều khoản</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Chúng tôi có thể cập nhật Điều khoản dịch vụ này theo thời gian để phản ánh các cải tiến sản phẩm hoặc quy định pháp luật mới. Những thay đổi quan trọng sẽ được thông báo rõ ràng trên ứng dụng.
          </p>
        </section>

        <div className="mt-12 rounded-2xl bg-paper-2 p-6 text-center text-sm text-subtle">
          Nếu bạn có bất kỳ câu hỏi nào về Điều khoản dịch vụ hoặc thực hành dữ liệu, vui lòng liên hệ đội ngũ Vox Flow.
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => go("auth")}>
              Quay lại Đăng nhập
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
