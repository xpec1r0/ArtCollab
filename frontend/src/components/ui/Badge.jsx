// src/components/ui/Badge.jsx
import React from "react";

const variantClasses = {
  neutral:
    "bg-slate-900/70 text-slate-200 border border-slate-600/80",
  success:
    "bg-emerald-900/70 text-emerald-200 border border-emerald-500/70",
  warning:
    "bg-amber-900/70 text-amber-100 border border-amber-500/70",
  danger:
    "bg-rose-900/70 text-rose-100 border border-rose-500/70",
  info:
    "bg-sky-900/70 text-sky-100 border border-sky-500/70",
};

function Badge({ children, variant = "neutral", className = "" }) {
  const variantClass = variantClasses[variant] ?? variantClasses.neutral;

  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 " +
        "text-[10px] font-medium uppercase tracking-wide " +
        "shadow-sm " +
        variantClass +
        " " +
        className
      }
    >
      {children}
    </span>
  );
}

export default Badge;
