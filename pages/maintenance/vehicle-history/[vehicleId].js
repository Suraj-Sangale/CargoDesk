"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import {
  FiArrowLeft,
  FiTruck,
  FiTool,
  FiCalendar,
  FiDollarSign,
  FiSettings,
  FiSearch,
  FiFilter,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiBox,
  FiCamera,
  FiImage,
  FiVideo,
  FiPlay,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiX,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiShield,
  FiRefreshCw,
  FiMapPin,
  FiCheck,
  FiEye,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { withUserSsr } from "@/utilities/withUserSsr";
import { postApiData, resolveMediaUrl } from "@/utilities/services/apiService";
import { getFleetByIdController } from "@/backend/controllers/fleetController";
import { getMaintenanceListByVehicleController } from "@/backend/controllers/fleetMaintenanceController";
import { FLEET_MAINTENANCE_TYPES, FLEET_MAINTENANCE_STATUSES } from "@/utilities/masterData";
import { formatIndiaDateTime } from "@/utilities/timeUtils";
import { showToast } from "@/utilities/toastService";

const DEFAULT_HERO = "/imges/png/fleet_truck_hero.jpg";

export default function VehicleMaintenanceHistoryPage({ pageData }) {
  const router = useRouter();
  const vehicle = pageData?.vehicle || null;

  // State management
  const [records, setRecords] = useState(pageData?.initialRecords || []);
  const [summary, setSummary] = useState(pageData?.initialSummary || {});
  const [pagination, setPagination] = useState(pageData?.initialPagination || { page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(pageData?.initialPagination?.page || 1);

  // Active Media Lightbox Modal
  const [activeMediaModal, setActiveMediaModal] = useState(null); // { record, mediaList, activeIndex }
  const [selectedRecordDetails, setSelectedRecordDetails] = useState(null);

  // Debounce search query (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch records when vehicleId, page, filters, or sort change
  const fetchRecords = useCallback(
    async (targetPage = 1) => {
      if (!vehicle?.id) return;
      setLoading(true);
      try {
        const payload = {
          vehicleId: vehicle.id,
          page: targetPage,
          limit: 10,
          status: "all",
          maintenance_type: typeFilter,
          dateFilter: dateFilter,
          sortBy: sortBy,
          search: debouncedSearch,
        };

        const res = await postApiData("GET_VEHICLE_MAINTENANCE", payload);
        if (res?.status) {
          setRecords(Array.isArray(res.data) ? res.data : []);
          if (res.summary) setSummary(res.summary);
          if (res.pagination) {
            setPagination(res.pagination);
            setPage(res.pagination.page);
          }
        } else {
          showToast({ message: res?.message || "Failed to load records", type: "error" });
        }
      } catch (err) {
        console.error("Error fetching vehicle maintenance history:", err);
        showToast({ message: "Network error loading maintenance history", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [vehicle?.id, typeFilter, dateFilter, sortBy, debouncedSearch]
  );

  // Trigger fetch on filter change (skip first render if SSR data matches)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchRecords(page);
  }, [fetchRecords, page]);

  // Handle vehicle photo
  const vehiclePhoto = useMemo(() => {
    if (!vehicle) return DEFAULT_HERO;
    const raw =
      vehicle.vehicle_photo ||
      vehicle.photo ||
      vehicle.image ||
      vehicle.vehicle_image ||
      vehicle.hero_image ||
      vehicle.s3_key;
    return raw ? resolveMediaUrl(raw) : DEFAULT_HERO;
  }, [vehicle]);

  const [imgSrc, setImgSrc] = useState(vehiclePhoto);
  useEffect(() => {
    setImgSrc(vehiclePhoto);
  }, [vehiclePhoto]);

  // Category Icon & Styling Helper
  const getCategoryDetails = (type) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("oil")) {
      return {
        icon: FiTool,
        bg: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Oil Change",
      };
    }
    if (t.includes("brake")) {
      return {
        icon: FiShield,
        bg: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Brake Check",
      };
    }
    if (t.includes("battery") || t.includes("electric")) {
      return {
        icon: FiTool,
        bg: "bg-purple-100 text-purple-700 border-purple-200",
        label: "Battery Replacement",
      };
    }
    if (t.includes("tyre") || t.includes("tire")) {
      return {
        icon: FiTool,
        bg: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Tyre Replacement",
      };
    }
    if (t.includes("breakdown") || t.includes("engine")) {
      return {
        icon: FiAlertTriangle,
        bg: "bg-rose-100 text-rose-700 border-rose-200",
        label: "Breakdown Repair",
      };
    }
    return {
      icon: FiTool,
      bg: "bg-indigo-100 text-indigo-700 border-indigo-200",
      label: type || "General Service",
    };
  };

  // Status Badge Helper
  const getStatusBadge = (st) => {
    const s = String(st || "").toLowerCase();
    if (s === "completed") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s === "in progress" || s === "in_progress") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (s === "cancelled") {
      return "bg-slate-100 text-slate-600 border-slate-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  // Open Media Lightbox
  const handleOpenMedia = (record, initialIndex = 0) => {
    if (!record?.media || record.media.length === 0) return;
    setActiveMediaModal({
      record,
      mediaList: record.media,
      activeIndex: initialIndex,
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeMediaModal) return;
      if (e.key === "Escape") setActiveMediaModal(null);
      if (e.key === "ArrowLeft") {
        setActiveMediaModal((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.mediaList.length - 1,
        }));
      }
      if (e.key === "ArrowRight") {
        setActiveMediaModal((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex < prev.mediaList.length - 1 ? prev.activeIndex + 1 : 0,
        }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaModal]);

  // Derived Summary Metric values
  const totalCount = summary.total_records !== undefined ? Number(summary.total_records) : pagination.total || records.length;
  const totalExpenseFormatted = Number(summary.total_expenditure || 0).toLocaleString("en-IN");
  const latestServiceDateFormatted = summary.last_maintenance_date
    ? moment(summary.last_maintenance_date).format("DD MMM YYYY")
    : records[0]?.maintenance_date
    ? moment(records[0].maintenance_date).format("DD MMM YYYY")
    : "None Recorded";
  const mostRecentType = summary.latest_type || records[0]?.maintenance_type || "General Service";

  // Calculate pagination showing string
  const startItem = totalCount === 0 ? 0 : (pagination.page - 1) * (pagination.limit || 10) + 1;
  const endItem = Math.min(startItem + records.length - 1, totalCount);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiAlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested vehicle could not be loaded or you do not have permission to view its maintenance records.
          </p>
          <button
            type="button"
            onClick={() => router.push("/maintenance-supervisor")}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            Return to Maintenance Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{vehicle.vehicle_number} — Vehicle Maintenance History | CargoDesk</title>
        <meta
          name="description"
          content={`Complete maintenance history, service ledger, and repair media evidence for vehicle ${vehicle.vehicle_number}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-[#F4F7FC] text-slate-900 pb-6 antialiased selection:bg-blue-600 selection:text-white">
        <div className="w-full space-y-3 sm:space-y-3.5 py-1 sm:py-2">

          {/* ============================================================
              1. Top Navigation & Back Button
              ============================================================ */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/maintenance-supervisor")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              title="Return to Maintenance Portal"
            >
              <FiArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Maintenance</span>
            </button>

            {/* Quick status on top right */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex text-xs font-bold text-slate-500">
                Vehicle ID: <span className="font-mono text-slate-800 ml-1">FL-{String(vehicle.id).padStart(6, "0")}</span>
              </span>
            </div>
          </div>

          {/* ============================================================
              2. Vehicle Banner Card (Hero Image + Info)
              ============================================================ */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100/70 via-purple-50/50 to-indigo-100/60 border border-slate-200/80 p-3 sm:p-4 shadow-xs">
            {/* Soft decorative background radial circle */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-3.5 sm:gap-4.5 z-10">
              {/* Vehicle Hero Image */}
              <div className="relative w-full sm:w-44 md:w-48 h-28 sm:h-28 rounded-xl overflow-hidden shadow-xs border border-white/80 bg-white shrink-0 group">
                <Image
                  src={imgSrc || DEFAULT_HERO}
                  alt={vehicle.vehicle_number}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 250px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  priority
                  onError={() => setImgSrc(DEFAULT_HERO)}
                />
              </div>

              {/* Title & Metadata Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5 w-full">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Vehicle Maintenance History
                </h1>

                {/* Registration & Status Badges */}
                <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900 font-mono font-bold text-xs sm:text-sm border border-purple-200/80 shadow-2xs">
                    {vehicle.vehicle_number}
                  </span>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      (vehicle.status || "Active").toLowerCase() === "active"
                        ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300/60"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    {vehicle.status || "Active"}
                  </span>
                </div>

                {/* Model, Year, Fuel specs line */}
                <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <FiTruck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{vehicle.vehicle_model || vehicle.vehicle_type || "Commercial Vehicle"}</span>
                  </span>

                  <span className="text-slate-300 hidden sm:inline">|</span>

                  <span className="inline-flex items-center gap-1">
                    <FiCalendar className="w-3 h-3 text-slate-500" />
                    <span>{vehicle.manufacturing_year || "2019"}</span>
                  </span>

                  <span className="text-slate-300 hidden sm:inline">|</span>

                  <span className="inline-flex items-center gap-1">
                    <FiTool className="w-3 h-3 text-slate-500" />
                    <span>{vehicle.fuel_type || "Diesel"}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              3. Four KPI Summary Cards Grid
              ============================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Total Records */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                  <FiTool className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {totalCount}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Total Maintenance Records
                </div>
              </div>
            </div>

            {/* Card 2: Total Expenditure */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                  ₹
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  ₹{totalExpenseFormatted}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Total Expenditure
                </div>
              </div>
            </div>

            {/* Card 3: Latest Maintenance Date */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <FiCalendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {latestServiceDateFormatted}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Latest Maintenance
                </div>
              </div>
            </div>

            {/* Card 4: Most Recent Type */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <FiSettings className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {mostRecentType}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Most Recent Type
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. Search & Filters Bar
              ============================================================ */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search maintenance records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
              {/* Date Filter */}
              <div className="relative shrink-0">
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-7 pr-6 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All Dates</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">This Year</option>
                </select>
                <FiCalendar className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <FiChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Maintenance Type Filter */}
              <div className="relative shrink-0">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-7 pr-6 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg outline-none cursor-pointer transition-colors max-w-[150px] truncate"
                >
                  <option value="all">All Types</option>
                  {FLEET_MAINTENANCE_TYPES.map((tp) => (
                    <option key={tp.type} value={tp.type}>
                      {tp.type}
                    </option>
                  ))}
                </select>
                <FiFilter className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <FiChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Sort By Filter */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="appearance-none pl-7 pr-6 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg outline-none cursor-pointer transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="cost_desc">Cost: High to Low</option>
                  <option value="cost_asc">Cost: Low to High</option>
                </select>
                <FiClock className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <FiChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ============================================================
              5. Maintenance Records List (Fleet Details Design)
              ============================================================ */}
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <ImSpinner9 className="w-7 h-7 text-blue-600 animate-spin mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">Loading maintenance records...</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Retrieving service history</p>
            </div>
          ) : records.length > 0 ? (
            <div className="space-y-3">
              {records.map((item) => {
                const hasAdditionalNotes =
                  item.additional_notes &&
                  item.additional_notes.trim() !== "" &&
                  item.additional_notes.trim() !== item.description?.trim();

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRecordDetails(item)}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3.5 cursor-pointer"
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center font-bold shrink-0">
                          <FiTool className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {item.maintenance_type || "General Service"}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                                item.status
                              )}`}
                            >
                              {item.status || "Reported"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                              {moment(item.maintenance_date || item.created_at).format("DD MMM YYYY")}
                            </span>
                            {item.garage_name && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px]" title={item.garage_name}>
                                  {item.garage_name}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Cost & Odometer */}
                      <div className="flex items-start sm:text-right gap-3 sm:gap-4 self-start sm:self-center">
                        {Number(item.cost || 0) > 0 && (
                          <div>
                            <span className="text-sm font-bold text-slate-900">
                              ₹{Number(item.cost || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}

                        {item.odometer_reading && (
                          <div className={`pl-3 ${Number(item.cost || 0) > 0 ? "border-l border-slate-200/80" : ""}`}>
                            <span className="text-[11px] font-semibold text-slate-400 block">Odometer</span>
                            <span className="text-xs font-bold text-slate-700">
                              {Number(item.odometer_reading).toLocaleString("en-IN")} KM
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description Snippet */}
                    {item.description && (
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        {item.description}
                      </p>
                    )}

                    {/* Additional Notes (if distinct) */}
                    {hasAdditionalNotes && (
                      <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                        <FiFileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{item.additional_notes}</span>
                      </div>
                    )}

                    {/* Attachments & Card Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Media Thumbnails Snippet */}
                      {item.media && item.media.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <FiImage className="w-3 h-3 text-blue-500" />
                            <span>
                              {item.media.length} ATTACHMENT{item.media.length > 1 ? "S" : ""}:
                            </span>
                          </span>
                          {item.media.slice(0, 4).map((m, mIdx) => (
                            <button
                              key={m.id || mIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMedia(item, mIdx);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer truncate max-w-[140px]"
                              title={m.file_name}
                            >
                              {m.media_type === "video" || m.mime_type?.startsWith("video/") ? (
                                <FiVideo className="w-3 h-3 text-purple-600 shrink-0" />
                              ) : (
                                <FiImage className="w-3 h-3 text-blue-600 shrink-0" />
                              )}
                              <span className="truncate">{m.file_name || `File ${mIdx + 1}`}</span>
                            </button>
                          ))}
                          {item.media.length > 4 && (
                            <span className="text-[11px] font-bold text-slate-400">
                              +{item.media.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">No media attached</span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordDetails(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <FiEye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs px-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                <FiTool className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">No Maintenance Records Found</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
                {searchQuery || typeFilter !== "all" || dateFilter !== "all"
                  ? "No previous maintenance logs match your current search and filter criteria. Try resetting your filters."
                  : `There are currently no maintenance records logged for vehicle ${vehicle.vehicle_number}. You can enter new service records from the supervisor portal.`}
              </p>

              {(searchQuery || typeFilter !== "all" || dateFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setDateFilter("all");
                    setSortBy("newest");
                    setPage(1);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* ============================================================
              6. Bottom Pagination Bar
              ============================================================ */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500 text-center sm:text-left">
                Showing <span className="text-slate-900 font-bold">{startItem}</span> –{" "}
                <span className="text-slate-900 font-bold">{endItem}</span> of{" "}
                <span className="text-slate-900 font-bold">{totalCount}</span> records
              </div>

              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <FiChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                  .map((p, index, array) => {
                    const prev = array[index - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400 text-xs select-none">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            page === p
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Next */}
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================
              7. Mobile-First Bottom Return Button (Matches responsive mockup)
              ============================================================ */}
          <div className="pt-4 sm:hidden">
            <button
              type="button"
              onClick={() => router.push("/maintenance-supervisor")}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-purple-200/90 text-purple-700 font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Maintenance</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            8. Media Lightbox / Viewer Modal
            ============================================================ */}
        {activeMediaModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
            onClick={() => setActiveMediaModal(null)}
          >
            {/* Modal Top Header */}
            <div
              className="flex items-center justify-between text-white max-w-5xl mx-auto w-full pt-1 pb-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold truncate">
                  {activeMediaModal.record?.maintenance_type} — Attachment
                </h4>
                <p className="text-xs text-slate-300">
                  {activeMediaModal.activeIndex + 1} of {activeMediaModal.mediaList.length} media files
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Download / Open Link */}
                {(() => {
                  const curr = activeMediaModal.mediaList[activeMediaModal.activeIndex];
                  const url = curr?.signedUrl || resolveMediaUrl(curr?.s3_key);
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Open full resolution in new tab"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  );
                })()}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setActiveMediaModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Close viewer (Esc)"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media Canvas (Middle) */}
            <div
              className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Previous Arrow */}
              {activeMediaModal.mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveMediaModal((prev) => ({
                      ...prev,
                      activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.mediaList.length - 1,
                    }))
                  }
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs"
                  title="Previous (Left Arrow)"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Media Content */}
              {(() => {
                const item = activeMediaModal.mediaList[activeMediaModal.activeIndex];
                const isVideo = item?.media_type === "video" || item?.mime_type?.startsWith("video/");
                const url = item?.signedUrl || resolveMediaUrl(item?.s3_key);

                if (isVideo) {
                  return (
                    <video
                      controls
                      autoPlay
                      src={url}
                      className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl bg-black"
                    />
                  );
                }

                return (
                  <div className="relative w-full h-[70vh] flex items-center justify-center">
                    <Image
                      src={url}
                      alt={item?.file_name || "Attachment"}
                      fill
                      unoptimized
                      className="object-contain rounded-2xl shadow-2xl"
                    />
                  </div>
                );
              })()}

              {/* Next Arrow */}
              {activeMediaModal.mediaList.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveMediaModal((prev) => ({
                      ...prev,
                      activeIndex: prev.activeIndex < prev.mediaList.length - 1 ? prev.activeIndex + 1 : 0,
                    }))
                  }
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs"
                  title="Next (Right Arrow)"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {activeMediaModal.mediaList.length > 1 && (
              <div
                className="max-w-5xl mx-auto w-full pt-3 pb-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {activeMediaModal.mediaList.map((m, idx) => {
                  const isVideo = m.media_type === "video" || m.mime_type?.startsWith("video/");
                  const url = m.signedUrl || resolveMediaUrl(m.s3_key);
                  const isSelected = idx === activeMediaModal.activeIndex;

                  return (
                    <button
                      key={m.id || idx}
                      type="button"
                      onClick={() =>
                        setActiveMediaModal((prev) => ({ ...prev, activeIndex: idx }))
                      }
                      className={`relative w-14 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "border-purple-400 scale-105 shadow-md"
                          : "border-white/30 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {isVideo ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                          <FiPlay className="w-3 h-3" />
                        </div>
                      ) : (
                        <Image src={url} alt="thumb" fill unoptimized className="object-cover" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            9. Record Details Modal
            ============================================================ */}
        {selectedRecordDetails && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setSelectedRecordDetails(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <FiTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Record #{selectedRecordDetails.id}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {formatIndiaDateTime(selectedRecordDetails.maintenance_date || selectedRecordDetails.created_at)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRecordDetails(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Key Details List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-bold text-slate-900">{selectedRecordDetails.maintenance_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedRecordDetails.status)}`}>
                    {selectedRecordDetails.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cost:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{Number(selectedRecordDetails.cost || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {selectedRecordDetails.odometer_reading && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Odometer:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {Number(selectedRecordDetails.odometer_reading).toLocaleString("en-IN")} KM
                    </span>
                  </div>
                )}
                {selectedRecordDetails.garage_name && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Workshop / Garage:</span>
                    <span className="font-bold text-slate-900">{selectedRecordDetails.garage_name}</span>
                  </div>
                )}
                {selectedRecordDetails.invoice_number && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedRecordDetails.invoice_number}</span>
                  </div>
                )}
                {selectedRecordDetails.created_by_name && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Logged By:</span>
                    <span className="font-semibold text-slate-800">{selectedRecordDetails.created_by_name}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedRecordDetails.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {selectedRecordDetails.description}
                  </p>
                </div>
              )}

              {/* Additional Notes */}
              {selectedRecordDetails.additional_notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Additional Notes</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                    {selectedRecordDetails.additional_notes}
                  </p>
                </div>
              )}

              {/* Media Button if any */}
              {Array.isArray(selectedRecordDetails.media) && selectedRecordDetails.media.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenMedia(selectedRecordDetails, 0);
                    setSelectedRecordDetails(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <FiImage className="w-4 h-4" />
                  <span>View {selectedRecordDetails.media.length} Evidence Attachment{selectedRecordDetails.media.length > 1 ? "s" : ""}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Layout configuration
VehicleMaintenanceHistoryPage.layoutName = "maintenance-supervisor";

export const getServerSideProps = withUserSsr(
  async (context, { user }) => {
    const { vehicleId } = context.params || {};
    const vid = Number(vehicleId);

    if (!vid || isNaN(vid)) {
      return { notFound: true };
    }

    try {
      // 1. Fetch Vehicle Profile (verifies organization boundaries)
      const fleetRes = await getFleetByIdController(vid, user);
      if (!fleetRes?.status || !fleetRes.data) {
        return { notFound: true };
      }

      // 2. Fetch Initial Maintenance List & Summary
      const maintRes = await getMaintenanceListByVehicleController(
        vid,
        { page: 1, limit: 10, sortBy: "newest" },
        context.req
      );

      return {
        props: {
          pageData: {
            vehicle: fleetRes.data,
            initialRecords: Array.isArray(maintRes?.data) ? maintRes.data : [],
            initialSummary: maintRes?.summary || {},
            initialPagination: maintRes?.pagination || { page: 1, totalPages: 1, total: 0 },
            user,
          },
        },
      };
    } catch (err) {
      console.error("Error in vehicle maintenance history getServerSideProps:", err);
      return { notFound: true };
    }
  },
  { allowedRoles: ["maintenance_supervisor", "admin", "super_admin"] }
);
