"use client";

import { useCallback, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 2000);
  }, []);

  const toast = message ? (
    <div className="fade-up pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div className="rounded-full bg-ink/90 px-4 py-2 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>
  ) : null;

  return { show, toast };
}
