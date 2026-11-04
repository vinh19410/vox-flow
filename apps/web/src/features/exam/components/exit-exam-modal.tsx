import { Button } from "@/components/ds/button";
import { Modal } from "@/components/ds/modal";

export interface ExitExamModalProps {
  open: boolean;
  onClose: () => void;
  onExit: () => void;
}

export function ExitExamModal({ open, onClose, onExit }: ExitExamModalProps) {
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="p-7 text-ink">
        <h2 className="text-xl font-bold">Thoát phòng thi?</h2>
        <p className="mt-2 text-sm text-ink-2">Các câu đã trả lời sẽ không được chấm.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Ở lại
          </Button>
          <Button onClick={onExit}>Thoát</Button>
        </div>
      </div>
    </Modal>
  );
}
