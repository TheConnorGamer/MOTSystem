"use client";

import { forwardRef } from "react";
import { cn, formatUkPlate, sanitiseReg } from "@/lib/utils";

interface UkPlateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  size?: "md" | "lg";
}

export const UkPlateInput = forwardRef<HTMLInputElement, UkPlateInputProps>(
  ({ value, onChange, className, size = "lg", ...props }, ref) => {
    const isLg = size === "lg";
    return (
      <div
        className={cn(
          "uk-plate-wrap flex w-full overflow-hidden shadow-lg",
          isLg ? "rounded-xl" : "rounded-lg",
          className
        )}
      >
        <div
          className={cn(
            "uk-plate-band flex shrink-0 flex-col items-center justify-center font-bold leading-none text-white",
            isLg ? "w-10 text-[10px]" : "w-8 text-[8px]"
          )}
        >
          <span className={isLg ? "text-base" : "text-sm"}>🇬🇧</span>
          <span>UK</span>
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.toUpperCase();
            onChange(formatUkPlate(sanitiseReg(raw)));
          }}
          placeholder="ENTER REG"
          maxLength={8}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "uk-plate-body w-full border-0 bg-transparent text-center font-bold uppercase text-black placeholder:text-black/35 focus:outline-none focus:ring-0",
            isLg
              ? "py-4 text-3xl tracking-[0.18em] sm:text-4xl"
              : "py-3 text-2xl tracking-[0.15em]"
          )}
          style={{ fontFamily: "var(--font-plate), 'Arial Black', sans-serif" }}
          {...props}
        />
      </div>
    );
  }
);
UkPlateInput.displayName = "UkPlateInput";
