import React from "react";

export default function MessagePageHeader({
  eyebrow = "MESSENGER",
  title = "Send a Message",
  subtitle = "Compose updates, choose recipients or groups, and broadcast instant SMS messages.",
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

      {/* Modern Messenger / Chat Vector Illustration */}
      <div className="hidden lg:block relative w-64 h-28 -my-3 pointer-events-none select-none">
        <svg
          viewBox="0 0 240 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <defs>
            <linearGradient id="msgGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
            </linearGradient>
            <filter id="msgShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Background Soft Glow Cloud */}
          <path
            d="M50 70 C40 30, 90 10, 140 25 C180 15, 220 40, 210 80 C190 105, 90 100, 50 70 Z"
            fill="url(#msgGlowGrad)"
          />

          {/* Back Chat Bubble Card */}
          <rect
            x="70"
            y="15"
            width="75"
            height="55"
            rx="12"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            filter="url(#msgShadow)"
          />
          <circle cx="88" cy="42" r="3.5" fill="#94A3B8" />
          <circle cx="100" cy="42" r="3.5" fill="#CBD5E1" />
          <circle cx="112" cy="42" r="3.5" fill="#E2E8F0" />
          <rect x="88" cy="27" width="38" height="4" rx="2" fill="#3B82F6" fillOpacity="0.7" />

          {/* Front Active Chat Bubble */}
          <g transform="translate(115, 30)">
            <rect
              x="0"
              y="0"
              width="85"
              height="55"
              rx="14"
              fill="url(#bubbleGrad)"
              filter="url(#msgShadow)"
            />
            {/* Chat Lines */}
            <rect x="14" y="14" width="45" height="4" rx="2" fill="#FFFFFF" fillOpacity="0.9" />
            <rect x="14" y="24" width="56" height="3" rx="1.5" fill="#BFDBFE" />
            <rect x="14" y="32" width="35" height="3" rx="1.5" fill="#93C5FD" fillOpacity="0.8" />
            {/* Paper Airplane Icon Accent */}
            <path
              d="M60 40 L65 30 L55 35 L58 37 Z"
              fill="#FFFFFF"
              fillOpacity="0.9"
            />
          </g>

          {/* Floating Message Dots / Accents */}
          <circle cx="65" cy="35" r="4" fill="#60A5FA" fillOpacity="0.5" />
          <circle cx="210" cy="45" r="3" fill="#93C5FD" fillOpacity="0.6" />
          <circle cx="195" cy="78" r="5" fill="#3B82F6" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
