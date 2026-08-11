export function PublicHeader() {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 dark:border-[var(--border-subtle)] dark:bg-[var(--bg-header)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-xs font-bold text-white">
        BS
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          Bluescope Booking
        </p>
        <p className="text-[11px] text-slate-400">Public view · MAC Media</p>
      </div>
    </header>
  );
}
