import React from "react";

export default function ManageContactsHeader({
  eyebrow = "CONTACTS",
  title = "Manage Contacts",
  subtitle = "Add, import, and organize your contacts and groups in one place.",
}) {
  return (
    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Title & Subtitle */}
      <div className="z-10 max-w-xl">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          {eyebrow}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-1.5">
          {title}
        </h1>
        <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
      </div>

      {/* Modern Contacts & Network Vector Illustration */}
      <div className="hidden lg:block relative w-72 h-28 -my-3 pointer-events-none select-none">
        <svg
          viewBox="0 0 280 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <defs>
            <linearGradient id="contactsGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="blueCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#3B82F6" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Background Soft Glow */}
          <ellipse cx="200" cy="55" rx="70" ry="45" fill="url(#contactsGlow)" />

          {/* Network Orbit Lines */}
          <path
            d="M 120 70 Q 190 20 250 50"
            stroke="#93C5FD"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M 140 35 Q 200 90 260 75"
            stroke="#BFDBFE"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="none"
            opacity="0.7"
          />

          {/* Avatar Node 1 (Top Left) */}
          <g transform="translate(130, 20)">
            <circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" filter="url(#cardShadow)" />
            <circle cx="12" cy="9" r="4" fill="#93C5FD" />
            <path d="M 6 19 C 6 15, 18 15, 18 19" fill="#93C5FD" />
          </g>

          {/* Avatar Node 2 (Bottom Left) */}
          <g transform="translate(115, 65)">
            <circle cx="14" cy="14" r="13" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" filter="url(#cardShadow)" />
            <circle cx="14" cy="11" r="4.5" fill="#60A5FA" />
            <path d="M 7 22 C 7 17, 21 17, 21 22" fill="#60A5FA" />
          </g>

          {/* Avatar Node 3 (Top Right) */}
          <g transform="translate(240, 25)">
            <circle cx="10" cy="10" r="9" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
            <circle cx="10" cy="8" r="3" fill="#93C5FD" />
            <path d="M 5 16 C 5 13, 15 13, 15 16" fill="#93C5FD" />
          </g>

          {/* Avatar Node 4 (Bottom Right) */}
          <g transform="translate(245, 68)">
            <circle cx="11" cy="11" r="10" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
            <circle cx="11" cy="9" r="3.5" fill="#BFDBFE" />
            <path d="M 5 18 C 5 15, 17 15, 17 18" fill="#BFDBFE" />
          </g>

          {/* Main Blue Contact Book Card */}
          <g transform="translate(170, 15)">
            {/* Book Spine Shadow / Back */}
            <rect
              x="-4"
              y="2"
              width="60"
              height="76"
              rx="12"
              fill="#1E40AF"
              opacity="0.3"
            />
            {/* Main Book Body */}
            <rect
              x="0"
              y="0"
              width="58"
              height="78"
              rx="12"
              fill="url(#blueCardGrad)"
              filter="url(#cardShadow)"
            />
            {/* White Contact Silhouette Inside Card */}
            <circle cx="29" cy="33" r="11" fill="#FFFFFF" />
            <circle cx="29" cy="30" r="4.5" fill="#3B82F6" />
            <path d="M 20 41 C 20 36, 38 36, 38 41" fill="#3B82F6" />
            
            {/* White horizontal line accents */}
            <rect x="18" y="52" width="22" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="22" y="59" width="14" height="2.5" rx="1.25" fill="#BFDBFE" fillOpacity="0.8" />
          </g>
        </svg>
      </div>
    </div>
  );
}
