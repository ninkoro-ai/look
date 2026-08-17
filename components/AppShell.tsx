"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAppData } from "@/hooks/useAppData";
import { IconCloset, IconDress, IconHeart, IconHome, IconUser } from "@/components/icons";

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
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-[0_0_60px_rgba(23,23,23,0.06)]">
      <main className="flex-1">{children}</main>
      <nav className="pb-safe sticky bottom-0 z-40 border-t border-line/70 bg-surface/92 backdrop-blur-md">
        <div className="grid grid-cols-5 items-end px-1 pt-1.5">
          <NavItem href="/" label="首页" Icon={IconHome} active={pathname === "/"} />
          <NavItem
            href="/wardrobe"
            label="衣橱"
            Icon={IconCloset}
            active={pathname.startsWith("/wardrobe")}
          />

          <Link
            href="/dress"
            prefetch={false}
            className="relative -top-3 flex flex-col items-center gap-0.5"
            aria-label="换装"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_20px_rgba(233,142,166,0.42)]">
              <IconDress width={23} height={23} />
            </span>
            <span
              className={`text-[10px] ${
                pathname.startsWith("/dress") ? "font-medium text-accent" : "text-muted"
              }`}
            >
              换装
            </span>
          </Link>

          <NavItem
            href="/favorites"
            label="收藏"
            Icon={IconHeart}
            active={pathname.startsWith("/favorites")}
          />
          <NavItem
            href="/profile"
            label="我的"
            Icon={IconUser}
            active={pathname.startsWith("/profile")}
          />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof IconHome;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex flex-col items-center gap-0.5 pb-2 pt-1 text-[10px]"
    >
      <Icon className={active ? "text-accent" : "text-muted"} width={21} height={21} />
      <span className={active ? "font-medium text-accent" : "text-muted"}>{label}</span>
    </Link>
  );
}
