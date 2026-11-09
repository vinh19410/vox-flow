import { isValidElement, type ElementType, type ReactNode } from "react";

import { cx } from "@/lib/cx";

import { Button, type BtnProps } from "./button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  variant?: BtnProps["variant"];
  icon?: ElementType<{ size?: number; className?: string }>;
  disabled?: boolean;
}

export interface EmptyStateProps {
  /** Lucide icon component or custom React element */
  icon?: ElementType<{ size?: number; className?: string }> | ReactNode;
  /** Main heading */
  title: ReactNode;
  /** Explanatory text */
  description?: ReactNode;
  /** Primary action: object with label/onClick or custom React element */
  action?: EmptyStateAction | ReactNode;
  /** Optional secondary action */
  secondaryAction?: EmptyStateAction | ReactNode;
  /** Custom container class */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show a dashed or solid border card wrapper */
  bordered?: boolean;
}

function isActionObject(action: unknown): action is EmptyStateAction {
  return typeof action === "object" && action !== null && "label" in action;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
  bordered = false,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = size === "sm" ? 20 : size === "lg" ? 32 : 24;
    const boxSize =
      size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";

    if (isValidElement(icon)) {
      return (
        <div
          className={cx(
            "grid place-items-center rounded-2xl bg-paper-2 text-subtle",
            boxSize,
          )}
        >
          {icon}
        </div>
      );
    }

    const IconComponent = icon as ElementType<{
      size?: number;
      className?: string;
    }>;
    return (
      <div
        className={cx(
          "grid place-items-center rounded-2xl bg-paper-2 text-subtle transition-colors",
          boxSize,
        )}
      >
        <IconComponent size={iconSize} className="text-subtle" />
      </div>
    );
  };

  const renderAction = (act: EmptyStateAction | ReactNode, isPrimary = true) => {
    if (!act) return null;
    if (isActionObject(act)) {
      const Icon = act.icon;
      return (
        <Button
          size={size === "sm" ? "sm" : "md"}
          variant={act.variant ?? (isPrimary ? "accent" : "outline")}
          onClick={act.onClick}
          disabled={act.disabled}
        >
          {Icon && <Icon size={size === "sm" ? 14 : 16} />}
          <span>{act.label}</span>
        </Button>
      );
    }
    return act;
  };

  return (
    <div
      data-testid="empty-state"
      className={cx(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "py-6 px-4",
        size === "md" && "py-10 px-6",
        size === "lg" && "py-16 px-8",
        bordered && "rounded-3xl border border-dashed border-line bg-paper/30",
        className,
      )}
    >
      {renderIcon()}

      <div className={cx(icon ? "mt-4" : "", "max-w-md space-y-1.5")}>
        <div
          className={cx(
            "font-bold text-ink",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
          )}
        >
          {title}
        </div>
        {description && (
          <p
            className={cx(
              "text-subtle",
              size === "sm" && "text-xs",
              size === "md" && "text-sm leading-relaxed",
              size === "lg" && "text-sm sm:text-base leading-relaxed",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {renderAction(action, true)}
          {renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}
