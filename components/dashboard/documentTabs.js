import React from "react";
import { FiFileText, FiCreditCard } from "react-icons/fi";

export default function DocumentTabs({ selectedTab, setSelectedTab }) {
  const tabs = [
    { id: "document", label: "Documents", icon: FiFileText },
    { id: "emi", label: "EMI", icon: FiCreditCard },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 mb-6">
      {tabs.map((tab) => {
        const active = selectedTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all duration-200 focus:outline-none ${
              active
                ? "text-blue-600 bg-white rounded-t-xl"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-xl"
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
            <span>{tab.label}</span>

            {/* Active underline indicator */}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-xs" />
            )}
          </button>
        );
      })}
    </div>
  );
}
