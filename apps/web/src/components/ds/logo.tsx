import { cx } from "@/lib/cx";

export interface LogoProps {
  dark?: boolean;
}

export function Logo({ dark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cx(
          "grid h-8 w-8 place-items-center rounded-xl",
          dark ? "bg-paper text-ink" : "bg-ink text-paper",
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="7"
            width="2.2"
            height="4"
            rx="1.1"
            fill="currentColor"
          />
          <rect
            x="6"
            y="4"
            width="2.2"
            height="10"
            rx="1.1"
            fill="currentColor"
          />
          <rect x="10" y="2" width="2.2" height="14" rx="1.1" fill="#FF5B24" />
          <rect
            x="14"
            y="6"
            width="2.2"
            height="6"
            rx="1.1"
            fill="currentColor"
          />
        </svg>
      </div>
      <span
        className={cx(
          "text-[17px] font-bold tracking-tight",
          dark ? "text-paper" : "text-ink",
        )}
      >
        Chấm<span className="text-brand">Rõ</span>
      </span>
    </div>
  );
}
