// src/components/ui/TagPill.jsx
import React from "react";

function TagPill({ label, className = "" }) {
  if (!label) return null;

  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-slate-700/70 " +
        "bg-slate-900/60 px-2.5 py-0.5 text-[10px] text-slate-300 " +
        "hover:border-fuchsia-400/70 hover:text-fuchsia-100 transition-colors " +
        className
      }
    >
      #{label}
    </span>
  );
}

export default TagPill;
