import React from "react";
import {
  FiShield,
  FiFileText,
  FiChevronRight,
  FiActivity,
} from "react-icons/fi";
import { FaCarSide, FaDumbbell, FaFileInvoiceDollar } from "react-icons/fa";

const cardThemes = {
  puc: {
    bg: "bg-[#EBF5FF] hover:bg-[#E1EFFF]",
    iconBg: "bg-blue-100 text-blue-600",
    icon: FaCarSide,
    label: "PUC",
  },
  insurance: {
    bg: "bg-[#ECFDF5] hover:bg-[#E2FAF0]",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: FiShield,
    label: "INSURANCE",
  },
  fitness: {
    bg: "bg-[#FFF7ED] hover:bg-[#FFEDD5]",
    iconBg: "bg-orange-100 text-orange-600",
    icon: FaDumbbell,
    label: "FITNESS",
  },
  permit: {
    bg: "bg-[#FAF5FF] hover:bg-[#F3E8FF]",
    iconBg: "bg-purple-100 text-purple-600",
    icon: FiFileText,
    label: "PERMIT",
  },
  tax: {
    bg: "bg-[#FFF1F2] hover:bg-[#FFE4E6]",
    iconBg: "bg-rose-100 text-rose-600",
    icon: FaFileInvoiceDollar,
    label: "TAX",
  },
};

const DocumentsFilterCard = ({
  item,
  onFilterClick,
  isSelected,
  isLoading = false,
}) => {
  const typeKey = (item.value || "").toLowerCase();
  const theme = cardThemes[typeKey] || {
    bg: "bg-slate-50 hover:bg-slate-100",
    iconBg: "bg-slate-200 text-slate-700",
    icon: FiFileText,
    label: item.label,
  };

  const IconComponent = theme.icon;

  // Calculate count string
  const hasRecords = item.totalCount > 0;
  const countDisplay = hasRecords
    ? `${item.totalCount - item.expiredCount} / ${item.totalCount}`
    : "-";
  const subtext = hasRecords ? "Valid Documents" : "No Records";

  return (
    <button
      type="button"
      onClick={() => onFilterClick(item.value)}
      className={`group relative overflow-hidden flex flex-col justify-between p-4 md:p-5 rounded-2xl text-left transition-all duration-200 border ${
        isSelected
          ? "ring-2 ring-blue-500 border-transparent shadow-md -translate-y-0.5"
          : "border-slate-200/50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
      } ${theme.bg} cursor-pointer min-w-[170px] flex-1`}
    >
      {/* Background Watermark Label Text */}
      <span
        aria-hidden="true"
        className="absolute -right-1 -bottom-1.5 text-2xl sm:text-4xl font-black uppercase tracking-tight text-slate-900/[0.1] group-hover:text-slate-900/[0.10] select-none pointer-events-none transition-colors duration-200 leading-none z-0"
      >
        {theme.label}
      </span>

      {/* Foreground Content */}
      <div className="relative z-10 w-full">
        {/* <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
          {theme.label}
        </span> */}

        {/* Row: Icon Container on Left, Counts on Right */}
        <div className="flex items-center justify-between w-full">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${theme.iconBg}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div>
            {/* Large Count */}
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200/80 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {countDisplay}
              </div>
            )}
            {/* Subtext */}
            {/* <div className="text-xs font-medium text-slate-400 mt-1">
              {isLoading ? (
                <div className="h-3.5 w-24 bg-slate-200/60 rounded animate-pulse mt-0.5" />
              ) : (
                subtext
              )}
            </div> */}
          </div>
        </div>
      </div>
    </button>
  );
};

export default DocumentsFilterCard;
