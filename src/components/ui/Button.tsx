import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "gold",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95";

  const variants = {
    gold: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/40 border border-amber-300/40",
    secondary:
      "bg-slate-800/80 text-amber-300 border border-amber-500/30 hover:bg-slate-700/80 hover:border-amber-400/50 shadow-md",
    danger: "bg-red-600/90 text-white border border-red-500/40 hover:bg-red-500 shadow-md shadow-red-600/20",
    ghost: "bg-transparent text-slate-300 hover:text-amber-400 hover:bg-slate-800/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-3 font-extrabold",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
