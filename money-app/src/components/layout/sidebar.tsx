"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Landmark,
  LayoutList,
  PieChart,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/shared/settings-modal";

/** 2 tab chính — dùng hằng ngày */
const NAV_MAIN = [
  { href: "/", label: "Nhập liệu", icon: LayoutList },
  { href: "/tong-quan", label: "Tổng quan", icon: PieChart },
] as const;

/** 3 mục phụ — mở khi cần */
const NAV_MORE = [
  { href: "/bluescope", label: "Bluescope", icon: Building2 },
  { href: "/finance", label: "Tài chính", icon: Landmark },
  { href: "/debts", label: "Nợ", icon: CreditCard },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative z-50 flex h-[60px] shrink-0 items-center gap-3 border-b border-[var(--line)] bg-white/90 px-3 backdrop-blur-md sm:gap-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg,#5145e5,#7c5cf5)",
              boxShadow: "0 6px 16px -6px rgba(81,69,229,.8)",
            }}
          >
            <Wallet className="h-[18px] w-[18px]" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-bold tracking-[-0.01em] text-[var(--ink)]">
              MONEY 2026
            </span>
          </span>
        </Link>

        {/* 2 tab chính + 3 mục phụ; cuộn ngang được trên điện thoại */}
        <nav className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-active={pathname === href}
              className="nav-link shrink-0"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          <span className="mx-1 h-6 w-px shrink-0 bg-[var(--line)]" />

          {NAV_MORE.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-active={pathname === href || pathname.startsWith(`${href}/`)}
              className="nav-link shrink-0"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Cài đặt"
          className="row-del shrink-0 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
