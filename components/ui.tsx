import type { ReactNode } from "react";

/** LOOK Design System 基础原语（纯视觉，不承载业务逻辑） */

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable shrink-0 rounded-full px-3.5 py-1.5 text-[12px] ${
        active
          ? "bg-ink font-medium text-white"
          : "card-hairline border-0 bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-soft px-2 py-0.5 text-[10px] text-muted">
      {children}
    </span>
  );
}

export function SoftCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-hairline rounded-[22px] bg-surface shadow-soft ${className}`}>
      {children}
    </div>
  );
}
