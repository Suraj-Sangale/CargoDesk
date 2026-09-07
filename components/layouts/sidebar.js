import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiHome,
  FiFileText,
  FiMessageSquare,
  FiFile,
  FiTruck,
  FiGrid,
  FiSettings,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineTruck } from "react-icons/hi";

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  sidebarRef,
}) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const mainNavItems = [
    {
      name: "Dashboard",
      icon: FiHome,
      path: "/",
      exact: true,
    },
    {
      name: "Documents",
      icon: FiFileText,
      path: "/documents",
    },
    {
      name: "Vehicle Documents",
      icon: FiFileText,
      path: "/vehicledocuments",
    },
    {
      name: "Drivers Documents",
      icon: FiFileText,
      path: "/driverdocuments",
    },
    {
      name: "Expenses",
      icon: FiFileText,
      path: "/expenses",
    },
    {
      name: "Messenger",
      icon: FiMessageSquare,
      path: "/messager",
    },
    {
      name: "Invoice",
      icon: FiFile,
      path: "/invoice",
      hasSubmenu: true,
      subItems: [
        { name: "New Invoice", path: "/invoice/new" },
        { name: "All Invoices", path: "/invoice" },
      ],
    },
    {
      name: "Daily Orders",
      icon: FiTruck,
      path: "/dailyorders",
    },
    {
      name: "Apps",
      icon: FiGrid,
      path: "/apps",
    },
  ];

  const secondaryNavItems = [
    {
      name: "Settings",
      icon: FiSettings,
      path: "/settings",
    },
    {
      name: "Help & Support",
      icon: FiHelpCircle,
      path: "/support",
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    return currentPath === item.path || currentPath.startsWith(item.path + "/");
  };

  const closeMobile = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <div
        className={`flex flex-col h-full bg-[#0B132B] text-slate-300 select-none overflow-x-hidden transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand / Logo Header */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center px-2" : "justify-between px-6"
          } py-5 border-b border-slate-800/60 min-h-[73px] overflow-hidden`}
        >
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={closeMobile}
            title="CargoDesk"
          >
            <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="4" />
                <circle cx="16" cy="8" r="4" />
                <circle cx="8" cy="16" r="4" />
                <circle cx="16" cy="16" r="4" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-white tracking-tight animate-fade-in whitespace-nowrap">
                CargoDesk
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={closeMobile}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 w-full">
          <div className="space-y-1 w-full">
            {mainNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              if (item.hasSubmenu && !collapsed) {
                return (
                  <div key={item.name} className="space-y-1 w-full">
                    <button
                      onClick={() => setInvoiceOpen(!invoiceOpen)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {invoiceOpen ? (
                        <FiChevronUp className="w-4 h-4 opacity-70 shrink-0" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 opacity-70 shrink-0" />
                      )}
                    </button>
                    {invoiceOpen && (
                      <div className="pl-10 pr-2 py-1 space-y-1 text-xs">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            onClick={closeMobile}
                            className="block py-1.5 px-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/40 transition-colors truncate"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={closeMobile}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center ${
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
                  } rounded-xl font-medium text-sm transition-all duration-200 group relative w-full ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="pt-4 pb-2 w-full">
            <div className="border-t border-slate-800/80" />
          </div>

          {/* Secondary Navigation */}
          <div className="space-y-1 w-full">
            {secondaryNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={closeMobile}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center ${
                    collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
                  } rounded-xl font-medium text-sm transition-all duration-200 group relative w-full ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Promotion / Pro-Tip Card or Collapsed Toggle */}
        <div className="p-3 mt-auto w-full overflow-hidden">
          {!collapsed ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-blue-900/30 border border-blue-500/20 p-4 text-white shadow-inner w-full">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 mb-2 border border-blue-400/20 shrink-0">
                <HiOutlineTruck className="w-5 h-5 text-blue-300" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">Stay connected</h4>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-3">
                Keep your fleet and team always in sync.
              </p>
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-2/3 rounded-full" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside
        ref={sidebarRef}
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl border-r border-slate-800/40 overflow-x-hidden transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={closeMobile}
          />
          {/* Drawer container */}
          <div
            ref={sidebarRef}
            className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B132B] shadow-2xl z-50 animate-slide-in overflow-x-hidden"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
