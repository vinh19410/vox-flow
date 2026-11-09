import { cx } from "@/lib/cx";

export interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        on ? "bg-good" : "bg-ink/15",
      )}
    >
      <span
        className={cx(
          "absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}
