import React, { useState, useRef, useEffect } from "react";
import {
  FiGrid,
  FiFileText,
  FiCreditCard,
  FiUser,
  FiTool,
  FiClock,
  FiChevronDown,
  FiShield,
  FiCompass,
} from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi";

export default function FleetTabs({
  activeTab,
  onTabChange,
  counts = {},
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreMenuOpen]);

  const tabs = [
    {
      id: "overview",
      name: "Overview",
      icon: FiGrid,
    },
    {
      id: "documents",
      name: "Documents",
      icon: HiOutlineDocumentText,
      count: counts.documents,
      countColor: "bg-blue-100 text-blue-700",
    },
    {
      id: "emi",
      name: "EMI",
      icon: FiCreditCard,
      count: counts.emi,
      countColor: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "driver",
      name: "Driver",
      icon: FiUser,
      count: counts.driver,
      countColor: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "maintenance",
      name: "Maintenance",
      icon: FiTool,
      count: counts.maintenance,
      countColor: "bg-amber-100 text-amber-700",
    },
    {
      id: "history",
      name: "Activity History",
      icon: FiClock,
      isPrimary: true,
    },
  ];

  const moreTabs = [
    { id: "insurance", name: "Insurance & PUC", icon: FiShield },
    { id: "gps", name: "GPS & Telematics", icon: FiCompass },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === activeTab);

  return (
    <div className="relative z-30 border-b border-slate-200/90 mb-5 flex items-center justify-between gap-1 select-none">
      {/* Scrollable Main Tabs Container */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 flex-1 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-3 text-sm font-semibold transition-all rounded-t-xl cursor-pointer shrink-0 ${
                isActive
                  ? "text-blue-600 bg-white/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span>{tab.name}</span>

              {tab.count !== undefined && tab.count !== null && (
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] text-xs font-bold rounded-full transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : tab.countColor || "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {/* Active Underline Pill Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

      {/* More Tabs Dropdown - Outside of Scroll Container to Prevent Overflow Clamping */}
      <div className="relative shrink-0 pl-1 pb-0.5" ref={moreRef}>
        <button
          type="button"
          onClick={() => setMoreMenuOpen((prev) => !prev)}
          className={`group relative flex items-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors cursor-pointer rounded-t-xl ${
            isMoreActive
              ? "text-blue-600 bg-white/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
          }`}
        >
          <span>More</span>
          <FiChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              moreMenuOpen
                ? "rotate-180 text-blue-600"
                : isMoreActive
                ? "text-blue-600"
                : "text-slate-400 group-hover:text-slate-600"
            }`}
          />

          {/* Active Underline if any More tab is active */}
          {isMoreActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-xs" />
          )}
        </button>

        {moreMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[10px] font-bold text-slate-400 px-3.5 py-1 uppercase tracking-wider">
              Additional Modules
            </div>
            {moreTabs.map((mTab) => {
              const MIcon = mTab.icon;
              const isCurrentActive = activeTab === mTab.id;
              return (
                <button
                  key={mTab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(mTab.id);
                    setMoreMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isCurrentActive
                      ? "text-blue-600 bg-blue-50/80 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isCurrentActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <MIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>{mTab.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
