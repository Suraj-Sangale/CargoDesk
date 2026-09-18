import React from "react";

export default function CommonHeader({
  eyebrow = "",
  title = "",
  subtitle = "",
  description = "",
  rightContent = null,
  illustration = null,
  children = null,
  className = "",
  contentClassName = "",
}) {
  const displaySubtitle = subtitle || description;
  const rightSection = rightContent || illustration || children;

  return (
    <div
      className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${className}`}
    >
      {/* Title & Description */}
      <div className={`z-10 max-w-xl ${contentClassName}`}>
        {eyebrow && (
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            {eyebrow}
          </span>
        )}
        {title && (
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-1.5">
            {title}
          </h1>
        )}
        {displaySubtitle && (
          <p className="text-sm text-slate-500 font-medium">
            {displaySubtitle}
          </p>
        )}
      </div>

      {/* Right Side Content / Illustration */}
      {rightSection && rightSection}
    </div>
  );
}
