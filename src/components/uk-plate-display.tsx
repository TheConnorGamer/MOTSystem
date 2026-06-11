import { cn, formatUkPlate } from "@/lib/utils";

interface UkPlateDisplayProps {
  registration: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    wrap: "rounded-md",
    band: "w-5 text-[7px]",
    body: "px-2 py-1 text-sm tracking-[0.12em]",
  },
  md: {
    wrap: "rounded-lg",
    band: "w-7 text-[9px]",
    body: "px-3 py-1.5 text-xl tracking-[0.15em]",
  },
  lg: {
    wrap: "rounded-xl",
    band: "w-9 text-[10px]",
    body: "px-5 py-2.5 text-3xl tracking-[0.18em]",
  },
};

export function UkPlateDisplay({
  registration,
  size = "md",
  className,
}: UkPlateDisplayProps) {
  const s = sizeClasses[size];
  return (
    <div
      className={cn(
        "uk-plate-wrap inline-flex overflow-hidden shadow-md",
        s.wrap,
        className
      )}
    >
      <div
        className={cn(
          "uk-plate-band flex shrink-0 flex-col items-center justify-center font-bold leading-none text-white",
          s.band
        )}
      >
        <span className="mt-0.5 text-[1.1em]">🇬🇧</span>
        <span>UK</span>
      </div>
      <div
        className={cn(
          "uk-plate-body flex items-center font-bold uppercase text-black",
          s.body
        )}
        style={{ fontFamily: "var(--font-plate), 'Arial Black', sans-serif" }}
      >
        {formatUkPlate(registration)}
      </div>
    </div>
  );
}
