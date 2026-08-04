import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function GlassCard({ children, className, glow, ...props }: GlassCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-[#0b1736]/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 shadow-xl text-slate-100",
          glow && "shadow-amber-500/20 border-amber-400/60 animate-pulse-glow",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
