import React, { useState } from "react";
import Image from "next/image";
import moment from "moment";
import {
  FiCopy,
  FiCheck,
  FiCamera,
  FiFileText,
  FiLayers,
  FiZap,
  FiCalendar,
  FiUser,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { HiOutlineTruck } from "react-icons/hi";
import { showToast } from "@/utilities/toastService";

export default function FleetSummaryCard({ fleet, onEditPhoto }) {
  const [copied, setCopied] = useState(false);

  const vehicleNo = fleet?.vehicle_number || "MH 03 CD 5678";
  const vehicleModel = fleet?.vehicle_model || "Tata 407";
  const vehicleType = fleet?.vehicle_type || "Goods Carrier";
  const status = (fleet?.status || "Active").trim();

  const formattedFleetId = fleet?.id
    ? `FL-${String(fleet.id).padStart(6, "0")}`
    : "FL-000123";

  const chassisNo = fleet?.chassis_number || "MAT447893J2K00123";
  const engineNo = fleet?.engine_number || "EN998877665544";
  const fuelType = fleet?.fuel_type || "Diesel";
  const owner = fleet?.ownership_type || "CargoDesk Logistics";
  const rcExpiry = fleet?.rc_expiry
    ? moment(fleet.rc_expiry).format("DD MMM YYYY")
    : "18 Nov 2030";
  const createdOn = fleet?.created_at
    ? moment(fleet.created_at).format("DD MMM YYYY")
    : "12 Jan 2024";

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(vehicleNo);
      setCopied(true);
      showToast({ message: "Vehicle Number copied to clipboard", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Vehicle Hero Photo Container */}
      <div className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden group">
        <Image
          src="/imges/png/fleet_truck_hero.jpg"
          alt={vehicleNo}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          priority
        />

        {/* Change Photo Overlay Pill */}
        <button
          type="button"
          onClick={onEditPhoto}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold rounded-full backdrop-blur-xs shadow-md transition-all cursor-pointer"
        >
          <FiCamera className="w-3.5 h-3.5" />
          <span>Change Photo</span>
        </button>
      </div>

      {/* Vehicle Header & Status Badge */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
              {vehicleNo}
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Copy vehicle number"
            >
              {copied ? (
                <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FiCopy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              status.toLowerCase() === "active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : status.toLowerCase() === "maintenance"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                status.toLowerCase() === "active"
                  ? "bg-emerald-500"
                  : status.toLowerCase() === "maintenance"
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
            />
            {status}
          </span>
        </div>

        {/* Brand & Model */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            T
          </div>
          <span className="font-bold text-slate-900 text-base">{vehicleModel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <HiOutlineTruck className="w-4 h-4 text-slate-400" />
          <span>{vehicleType}</span>
          <span className="text-slate-300">•</span>
          <span>4 Wheeler</span>
        </div>
      </div>

      {/* Detailed Key-Value Specifications List */}
      <div className="p-5 space-y-3.5 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiLayers className="w-4 h-4 text-slate-400" />
            <span>Fleet ID</span>
          </span>
          <span className="font-semibold text-slate-800 font-mono">
            {formattedFleetId}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-slate-400" />
            <span>Chassis No.</span>
          </span>
          <span className="font-semibold text-slate-800 font-mono truncate max-w-[170px]" title={chassisNo}>
            {chassisNo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiZap className="w-4 h-4 text-slate-400" />
            <span>Engine No.</span>
          </span>
          <span className="font-semibold text-slate-800 font-mono truncate max-w-[170px]" title={engineNo}>
            {engineNo}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <HiOutlineTruck className="w-4 h-4 text-slate-400" />
            <span>Vehicle Type</span>
          </span>
          <span className="font-semibold text-slate-800 text-right">{vehicleType}</span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiZap className="w-4 h-4 text-slate-400" />
            <span>Fuel Type</span>
          </span>
          <span className="font-semibold text-slate-800">{fuelType}</span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-slate-400" />
            <span>RC Expiry</span>
          </span>
          <span className="font-semibold text-slate-800">{rcExpiry}</span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiUser className="w-4 h-4 text-slate-400" />
            <span>Owner</span>
          </span>
          <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]" title={owner}>
            {owner}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-500 flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-slate-400" />
            <span>Created On</span>
          </span>
          <span className="font-semibold text-slate-800">{createdOn}</span>
        </div>
      </div>
    </div>
  );
}
