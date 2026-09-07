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
        <p className="text-sm text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Subtle Document & Shield Vector Illustration */}
      <div className="hidden lg:block relative w-64 h-28 -my-3 pointer-events-none select-none">
        <svg
          viewBox="0 0 240 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <defs>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
            </linearGradient>
            <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Background Soft Glow Cloud */}
          <path
            d="M50 70 C40 30, 90 10, 140 25 C180 15, 220 40, 210 80 C190 105, 90 100, 50 70 Z"
            fill="url(#glowGrad)"
          />

          {/* Back Document Card */}
          <rect
            x="110"
            y="12"
            width="65"
            height="75"
            rx="8"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            filter="url(#cardShadow)"
            transform="rotate(6 142 50)"
          />
          <rect x="122" y="24" width="30" height="4" rx="2" fill="#CBD5E1" transform="rotate(6 137 26)" />
          <rect x="124" y="34" width="40" height="3" rx="1.5" fill="#E2E8F0" transform="rotate(6 144 35)" />
          <rect x="126" y="42" width="35" height="3" rx="1.5" fill="#E2E8F0" transform="rotate(6 143 43)" />

          {/* Front Main Document Card */}
          <rect
            x="80"
            y="18"
            width="75"
            height="80"
            rx="10"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            filter="url(#cardShadow)"
          />
          {/* Document Content Lines */}
          <rect x="94" y="30" width="36" height="4.5" rx="2" fill="#3B82F6" fillOpacity="0.8" />
          <rect x="94" y="42" width="48" height="3" rx="1.5" fill="#94A3B8" />
          <rect x="94" y="50" width="40" height="3" rx="1.5" fill="#CBD5E1" />
          <rect x="94" y="58" width="44" height="3" rx="1.5" fill="#E2E8F0" />

          {/* Soft Leaves / Foliage Accents */}
          <path
            d="M60 85 C65 65, 80 60, 92 72 C80 82, 70 88, 60 85 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M175 60 C190 55, 205 70, 195 85 C180 80, 172 70, 175 60 Z"
            fill="url(#leafGrad)"
          />

          {/* Blue Security Shield with Checkmark */}
          <g transform="translate(135, 42)">
            <path
              d="M20 0 L36 6 C36 22, 24 35, 20 38 C16 35, 4 22, 4 6 L20 0 Z"
              fill="url(#shieldGrad)"
              filter="url(#cardShadow)"
            />
            {/* White Checkmark inside Shield */}
            <path
              d="M14 19 L18 23 L26 15"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
