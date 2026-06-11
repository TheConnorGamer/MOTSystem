import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, type LucideIcon } from "lucide-react";

const colorMap = {
  blue: "bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700",
  navy: "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800",
  orange: "bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600",
  green: "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600",
  purple: "bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600",
  yellow: "bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400",
  teal: "bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600",
  black: "bg-gradient-to-br from-zinc-800 to-black hover:from-zinc-700 hover:to-zinc-900",
};

interface ActionTileProps {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  tag?: string;
  color: keyof typeof colorMap;
  external?: boolean;
}

export function ActionTile({
  href,
  onClick,
  icon: Icon,
  label,
  sublabel,
  tag,
  color,
  external,
}: ActionTileProps) {
  const content = (
    <div
      className={cn(
        "group relative flex min-h-[92px] flex-col justify-between rounded-2xl p-4 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
        colorMap[color],
        color === "yellow" ? "" : "text-white"
      )}
    >
      {tag && (
        <span
          className={cn(
            "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
            color === "yellow" ? "bg-amber-950/15 text-amber-950" : "bg-black/20 text-white/90"
          )}
        >
          {tag}
        </span>
      )}
      <div className="flex items-start justify-between">
        <Icon className={cn("h-7 w-7 opacity-90", color === "yellow" && "text-amber-950")} />
        <ChevronRight
          className={cn(
            "h-5 w-5 opacity-60 transition-transform group-hover:translate-x-0.5",
            color === "yellow" ? "text-amber-950" : "text-white"
          )}
        />
      </div>
      <div>
        <p className={cn("font-bold leading-tight", color === "yellow" && "text-amber-950")}>
          {label}
        </p>
        {sublabel && (
          <p
            className={cn(
              "mt-0.5 text-[11px] leading-snug opacity-80",
              color === "yellow" ? "text-amber-900" : "text-white/85"
            )}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }
  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
