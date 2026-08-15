"use client";

import { useEffect, useState } from "react";

/**
 * Client-side access gate.
 * Port từ dashboard-v2.html ACCESS_LOCK — dùng SHA-256 hash để verify password,
 * lưu trust token trong localStorage. Trên bluescope.* domain thì tự bypass.
 *
 * KHÔNG bảo mật hoàn hảo (client-side check) — chỉ dùng để chặn người tình cờ vào.
 * Data thật sự bảo vệ ở Neon Postgres + Vercel env.
 */

const ACCESS_LOCK = {
  trustedKey: "money2026_trusted_device_v1",
  passHash: "078ff05b6f3d6ea327efe0b40559eb00f11c9b44b8b68bd3f4d18b46e00e9f71",
  grantHash: "8a176435c929642668c9c7c606ec3b30a1c504941b0f06783e612bc6cc50cdf1",
  deviceLabel: "d0:c0:50:d9:62:2d",
};

async function sha256Text(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isBluescopeHost() {
  if (typeof window === "undefined") return false;
  return /^bluescope\./i.test(window.location.hostname || "");
}

function isTrustedFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(ACCESS_LOCK.trustedKey);
    if (!raw) return false;
    const t = JSON.parse(raw);
    return (
      t?.passHash === ACCESS_LOCK.passHash ||
      (t?.grantHash === ACCESS_LOCK.grantHash && t?.deviceLabel === ACCESS_LOCK.deviceLabel)
    );
  } catch {
    return false;
  }
}

function trustThisDevice() {
  try {
    localStorage.setItem(
      ACCESS_LOCK.trustedKey,
      JSON.stringify({
        passHash: ACCESS_LOCK.passHash,
        grantHash: ACCESS_LOCK.grantHash,
        deviceLabel: ACCESS_LOCK.deviceLabel,
        trustedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* ignore */
  }
}

/** Nếu URL có ?grant=<mac> khớp grantHash, tự trust ngay. */
async function tryGrantFromUrl(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const grant = url.searchParams.get("grant") || url.searchParams.get("mac");
  if (!grant) return false;
  const hash = await sha256Text(grant.toLowerCase());
  if (hash === ACCESS_LOCK.grantHash) {
    trustThisDevice();
    url.searchParams.delete("grant");
    url.searchParams.delete("mac");
    window.history.replaceState(null, "", url.toString());
    return true;
  }
  return false;
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "locked" | "unlocked">("loading");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      // Bluescope domain: không cần lock
      if (isBluescopeHost()) {
        setState("unlocked");
        return;
      }
      if (isTrustedFromStorage()) {
        setState("unlocked");
        return;
      }
      if (await tryGrantFromUrl()) {
        setState("unlocked");
        return;
      }
      setState("locked");
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pass.trim()) return;
    const hash = await sha256Text(pass);
    if (hash === ACCESS_LOCK.passHash) {
      trustThisDevice();
      setState("unlocked");
    } else {
      setError("Sai mật khẩu");
      setPass("");
    }
  };

  if (state === "loading") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--ink-3)]">Đang kiểm tra thiết bị…</p>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="fixed inset-0 grid place-items-center bg-gradient-to-br from-violet-50 via-white to-violet-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-violet-200/60 dark:bg-slate-800 dark:shadow-black/40">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white">
            NT
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Khoá MONEY 2026
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Chỉ thiết bị đã được cấp quyền mới mở được dashboard. Nhập pass một lần
            để cấu hình máy này.
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-[12px] dark:bg-slate-900">
            <span className="font-medium text-slate-500">Thiết bị gốc</span>
            <span className="ml-auto float-right font-mono text-slate-800 dark:text-slate-200">
              {ACCESS_LOCK.deviceLabel}
            </span>
          </div>
          <form onSubmit={submit} className="mt-4 flex gap-2">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Nhập pass truy cập"
              autoFocus
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Mở khoá
            </button>
          </form>
          {error && (
            <p className="mt-2 text-[12px] font-medium text-rose-500">{error}</p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Lưu ý: trình duyệt không đọc được MAC thật, nên quyền thiết bị được lưu
            bằng token riêng trên máy đã mở khoá.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
