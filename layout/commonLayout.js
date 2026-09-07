import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layouts/sidebar";
import TopHeader from "@/components/layouts/topHeader";

export default function CommonLayout({ children, pageProps = {} }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  // Collapse / close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking the toggle button itself, let the button onClick handle it
      if (toggleBtnRef.current && toggleBtnRef.current.contains(event.target)) {
        return;
      }

      // If clicking inside the sidebar, don't collapse
      if (sidebarRef.current && sidebarRef.current.contains(event.target)) {
        return;
      }

      // 1. If mobile drawer is open -> close it
      if (isMobileOpen) {
        setIsMobileOpen(false);
      }

      // 2. If desktop sidebar is expanded -> collapse it
      if (!isCollapsed) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileOpen, isCollapsed]);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FC] overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        sidebarRef={sidebarRef}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <TopHeader
          pageData={pageProps.pageData}
          onToggleSidebar={handleToggleSidebar}
          toggleBtnRef={toggleBtnRef}
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
