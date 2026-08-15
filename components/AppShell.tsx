"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAppData } from "@/hooks/useAppData";
import { IconCloset, IconDress, IconHome } from "@/components/icons";

const NAV = [
  { href: "/", label: "首页", Icon: IconHome },
  { href: "/wardrobe", label: "衣橱", Icon: IconCloset },
  { href: "/dress", label: "换装", Icon: IconDress },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { ready } = useAppData();
  const pathname = usePathname();

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-sm text-muted">正在整理你的衣橱…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-[0_0_60px_rgba(42,36,32,0.08)]">
      <main className="flex-1">{children}</main>
      <nav className="pb-safe sticky bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-md">
        <div className="grid grid-cols-3">
          {NAV.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px]"
              >
                <Icon
                  className={
                    active
                      ? "text-accent"
                      : "text-muted"
                  }
                  width={22}
                  height={22}
                />
                <span className={active ? "font-medium text-accent" : "text-muted"}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
