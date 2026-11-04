import { CircleCheck } from "lucide-react";

export interface ProtoToastProps {
  message: string | null;
}

export function ProtoToast({ message }: ProtoToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 animate-rise items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-xl lg:bottom-8">
      <CircleCheck size={16} className="text-good-soft" />
      {message}
    </div>
  );
}
