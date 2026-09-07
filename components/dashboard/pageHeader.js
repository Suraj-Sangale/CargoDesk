import React from "react";

export default function PageHeader({
  eyebrow = "DOCUMENTS",
  title = "Vehicle Documents",
  subtitle = "Track and manage all your vehicle documents in one place.",
}) {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Title & Description */}
      <div className="z-10 max-w-xl">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          {eyebrow}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-1.5">
          {title}
        </h1>
        <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
      </div>

      {/* Header Illustration */}
      <div className="hidden md:flex items-center justify-end shrink-0 pointer-events-none select-none -my-2">
        <div className="relative w-28 h-14 lg:w-68 lg:h-40 flex items-center justify-center">
          <img
            src="/imges/layouts/newdDshboard.png"
            alt={title || "Dashboard Illustration"}
            className="w-full h-full object-contain drop-shadow-xs"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

