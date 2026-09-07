import React from "react";

export default function StatusBadge({ type = "", className = "" }) {
  const normalized = (type || "").toString().trim().toUpperCase();

  const badgeStyles = {
    PUC: "bg-blue-100 text-blue-600 border-blue-200",
    INSURANCE: "bg-emerald-100 text-emerald-600 border-emerald-200",
    FITNESS: "bg-orange-100 text-orange-600 border-orange-200",
    PERMIT: "bg-purple-100 text-purple-600 border-purple-200",
    TAX: "bg-rose-100 text-rose-600 border-rose-200",
  };

  const currentStyle =
    badgeStyles[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border border-transparent shadow-2xs ${currentStyle} ${className}`}
    >
      {normalized || "N/A"}
    </span>
  );
}
