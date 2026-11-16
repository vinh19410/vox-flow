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
          <p className="text-sm leading-relaxed text-ink-2">
            Bạn cần đủ 16 tuổi trở lên để tự đăng ký và sử dụng Vox Flow. Nếu bạn chưa đủ 16 tuổi, cha mẹ hoặc người giám hộ hợp pháp phải đọc, đồng ý với các điều khoản này (bao gồm việc chuyển dữ liệu ra nước ngoài tại Mục 4) và chịu trách nhiệm về việc sử dụng của bạn.
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
          <p className="text-sm leading-relaxed text-ink-2">
            Giọng nói và lời nói của bạn có thể chứa thông tin cá nhân, ví dụ khi bạn tự giới thiệu họ tên, quê quán, trường học hoặc nơi làm việc trong Part 1. Bạn có thể tránh nêu thông tin định danh thật khi trả lời; việc này không ảnh hưởng đến điểm số.
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            Vox Flow không dùng bài làm của bạn để huấn luyện mô hình AI. Nếu sau này chúng tôi muốn dùng bài làm để hiệu chuẩn độ chính xác chấm điểm, chúng tôi sẽ hỏi ý kiến bạn riêng và chỉ dùng khi bạn đồng ý.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Chuyển dữ liệu ra nước ngoài</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Để chấm bài, Vox Flow sử dụng các nhà cung cấp dịch vụ có máy chủ đặt ngoài Việt Nam. Khi bạn làm bài và gửi chấm, dữ liệu của bạn được chuyển ra nước ngoài như sau:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-2">
            <li>
              <strong>OpenAI (Hoa Kỳ):</strong> nhận tệp ghi âm câu trả lời để chuyển thành văn bản, và nhận bản văn bản đó cùng câu hỏi để chấm điểm theo tiêu chí IELTS.
            </li>
            <li>
              <strong>Cloudflare:</strong> vận hành máy chủ ứng dụng, cơ sở dữ liệu và kho lưu trữ tệp ghi âm. Trung tâm dữ liệu có thể đặt ngoài Việt Nam.
            </li>
            <li>
              <strong>ElevenLabs:</strong> chỉ nhận nội dung câu hỏi để tạo giọng đọc của giám khảo; không nhận giọng nói hay câu trả lời của bạn.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-ink-2">
            Các nhà cung cấp trên chỉ xử lý dữ liệu để thực hiện đúng việc được nêu, không phải để Vox Flow bán hoặc chia sẻ dữ liệu của bạn cho mục đích quảng cáo. Bằng việc đăng ký và sử dụng tính năng ghi âm và chấm điểm, bạn đồng ý cho Vox Flow chuyển dữ liệu ra nước ngoài theo mục này. Nếu không đồng ý, bạn không nên sử dụng tính năng ghi âm và chấm điểm.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">5. Quyền của bạn đối với dữ liệu</h2>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-ink-2">
            <li>Yêu cầu nhận bản sao dữ liệu cá nhân mà Vox Flow đang lưu về bạn.</li>
            <li>Rút lại sự đồng ý cho việc chuyển dữ liệu ra nước ngoài bằng cách ngừng sử dụng tính năng ghi âm và chấm điểm, kèm yêu cầu xóa dữ liệu đã có.</li>
            <li>Yêu cầu xóa tài khoản, tệp ghi âm và kết quả chấm điểm.</li>
          </ul>
          <p className="text-sm leading-relaxed text-ink-2">
            Để thực hiện các quyền trên, vui lòng liên hệ đội ngũ Vox Flow. Chúng tôi xử lý yêu cầu và phản hồi trong thời hạn pháp luật quy định.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">6. Quy định sử dụng hợp lý</h2>
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
          <h2 className="text-xl font-bold">7. Quyền sở hữu trí tuệ</h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Toàn bộ giao diện, thuật toán chấm điểm, hệ thống câu hỏi, đề forecast và tài liệu hướng dẫn trên Vox Flow thuộc quyền sở hữu của Vox Flow. Người dùng giữ quyền sở hữu đối với nội dung phát ngôn cá nhân của mình trong các bài thi thử.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">8. Thay đổi điều khoản</h2>
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
