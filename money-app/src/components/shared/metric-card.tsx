import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  tone?: "default" | "danger" | "success" | "warn";
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "border-0 bg-white/95 shadow-sm ring-1 ring-stone-200 dark:bg-[var(--surface-1)] dark:ring-[var(--border-default)]",
        tone === "danger" && "ring-red-200 dark:ring-red-900/40",
        tone === "success" && "ring-emerald-200",
        tone === "warn" && "ring-amber-200",
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-[var(--text-secondary)]">
              {title}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xl font-semibold leading-none text-slate-900 dark:text-[var(--text-primary)]",
                tone === "danger" && "text-red-600",
                tone === "success" && "text-emerald-600",
                tone === "warn" && "text-amber-600"
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600 dark:bg-[var(--accent-soft)] dark:text-[var(--accent)]">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
