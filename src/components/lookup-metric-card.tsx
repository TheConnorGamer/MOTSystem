import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const variants = {
  green: "from-emerald-500 to-emerald-700",
  blue: "from-blue-500 to-blue-700",
  amber: "from-amber-500 to-orange-500",
  red: "from-red-500 to-red-700",
  slate: "from-slate-500 to-slate-700",
  purple: "from-violet-500 to-violet-700",
};

interface LookupMetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  variant?: keyof typeof variants;
  badge?: string;
}

export function LookupMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = "blue",
  badge,
}: LookupMetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
        variants[variant]
      )}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-xl bg-white/20 p-2">
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold uppercase">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/80">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-sm font-medium text-white/90">{sub}</p>}
    </div>
  );
}
