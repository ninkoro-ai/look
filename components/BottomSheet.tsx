"use client";

import type { ReactNode } from "react";
import { IconX } from "@/components/icons";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fade-up relative w-full max-w-[430px] rounded-t-[28px] bg-surface px-5 pb-8 pt-4 shadow-[0_-12px_40px_rgba(42,36,32,0.15)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition hover:bg-sand"
            aria-label="关闭"
          >
            <IconX width={20} height={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
}
