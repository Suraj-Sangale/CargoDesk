import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiHome,
  FiChevronRight,
  FiTruck,
  FiEdit2,
  FiPlus,
  FiMoreVertical,
  FiCopy,
  FiCheck,
  FiShield,
  FiTool,
} from "react-icons/fi";
import { HiOutlineTruck } from "react-icons/hi";
import { showToast } from "@/utilities/toastService";

export default function FleetHeader({
  fleet,
  onEditFleet,
  onAddDocument,
  onStatusChange,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const vehicleNo = fleet?.vehicle_number || "MH 03 CD 5678";
  const vehicleModel = fleet?.vehicle_model || "Tata 407";
  const vehicleType = fleet?.vehicle_type || "Goods Carrier";
  const status = (fleet?.status || "Active").trim();

  const handleCopyVehicleNo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vehicleNo);
      setCopied(true);
      showToast({ message: "Vehicle number copied to clipboard", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "active" || st === 1 || st === "1") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Active
        </span>
      );
    }
    if (s === "maintenance" || s === "in maintenance") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Maintenance
        </span>
      );
    }
    if (s === "in transit" || s === "in_transit") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
        Inactive
      </span>
    );
  };

  return (
    <div className="pt-2 pb-4">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 select-none">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <FiHome className="w-3.5 h-3.5 text-slate-400" />
          <span>Home</span>
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <Link
          href="/fleets"
          className="hover:text-blue-600 font-medium text-slate-600 transition-colors"
        >
          Fleet
        </Link>
        <FiChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-blue-600 font-semibold">Fleet Details</span>
      </nav>

      {/* Main Header Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Truck Icon + Info */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50/80 border border-blue-100/90 flex items-center justify-center shrink-0 text-blue-600 shadow-xs">
            <HiOutlineTruck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{vehicleNo}</span>
              </h1>
              {getStatusBadge(status)}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{vehicleModel}</span>
              <span className="text-slate-300">•</span>
              <span>{vehicleType}</span>
              {fleet?.capacity && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{fleet.capacity}</span>
                </>
              )}
              {fleet?.fuel_type && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{fleet.fuel_type}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={onEditFleet}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50/60 border border-blue-200 hover:border-blue-300 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FiEdit2 className="w-4 h-4 text-blue-600" />
            <span>Edit Fleet</span>
          </button>

          <button
            type="button"
            onClick={onAddDocument}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-blue-500/25 hover:shadow-sm"
          >
            <FiPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Document</span>
          </button>

          {/* More Options Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              aria-label="More actions"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyVehicleNo();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  {copied ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4 text-slate-400" />}
                  <span>{copied ? "Copied!" : "Copy Vehicle No"}</span>
                </button>

                {onStatusChange && (
                  <>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange(status === "Active" ? "Maintenance" : "Active");
                        setMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <FiTool className="w-4 h-4 text-amber-500" />
                      <span>
                        Set to {status === "Active" ? "Maintenance" : "Active"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
