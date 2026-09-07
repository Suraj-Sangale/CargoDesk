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
      <div className="flex flex-col h-full w-full bg-[#0B132B] text-slate-300 select-none overflow-x-hidden">
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60 min-h-[73px] overflow-hidden shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3.5 group select-none overflow-hidden"
            onClick={closeMobile}
            title="CargoDesk"
          >
            <div className="relative shrink-0 w-8 h-8 flex items-center justify-center">
              <img src="/lightLogo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                collapsed
                  ? "max-w-0 opacity-0 -translate-x-3 pointer-events-none"
                  : "max-w-[160px] opacity-100 translate-x-0"
              }`}
            >
              <span className="text-xl font-bold text-white tracking-tight">
                CargoDesk
              </span>
            </div>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1.5 sidebar-scrollbar w-full">
          <div className="space-y-1 w-full">
            {mainNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              if (item.hasSubmenu && !collapsed) {
                return (
                  <div key={item.name} className="space-y-1 w-full">
                    <button
                      onClick={() => setInvoiceOpen(!invoiceOpen)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-slate-300" />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                      {invoiceOpen ? (
                        <FiChevronUp className="w-4 h-4 opacity-70 shrink-0" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 opacity-70 shrink-0" />
                      )}
                    </button>
                    {invoiceOpen && (
                      <div className="pl-10 pr-2 py-1 space-y-1 text-xs animate-fade-in">
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
                  className={`flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 group relative w-full overflow-hidden ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        active ? "text-white" : "text-slate-400 group-hover:text-white"
                      }`}
                    />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                      collapsed
                        ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                        : "max-w-[170px] opacity-100 translate-x-0 ml-3"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="pt-3 pb-2 w-full">
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
                  className={`flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 group relative w-full overflow-hidden ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
                      collapsed
                        ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                        : "max-w-[170px] opacity-100 translate-x-0 ml-3"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Promotion / Pro-Tip Card or Collapsed Toggle */}
        <div className="p-3 mt-auto w-full overflow-hidden shrink-0">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed
                ? "max-h-0 opacity-0 pointer-events-none mb-0"
                : "max-h-48 opacity-100"
            }`}
          >
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
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed
                ? "max-h-12 opacity-100 mt-1"
                : "max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside
        ref={sidebarRef}
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl border-r border-slate-800/40 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      <div
        className={`fixed inset-0 z-50 md:hidden flex overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobile}
        />
        {/* Drawer container */}
        <div
          ref={sidebarRef}
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-[#0B132B] shadow-2xl z-50 overflow-hidden transition-transform duration-300 ease-in-out ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {renderSidebarContent(true)}
        </div>
      </div>
    </>
  );
}
