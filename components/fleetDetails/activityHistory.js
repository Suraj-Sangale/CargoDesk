import React, { useState, useEffect, useMemo, useRef } from "react";
import moment from "moment";
import {
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiMoreVertical,
  FiFileText,
  FiUser,
  FiCreditCard,
  FiTool,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiEye,
  FiFile,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineTruck, HiOutlineDocumentText } from "react-icons/hi";
import ActivityDetailModal from "./activityDetailModal";

export default function ActivityHistory({
  fleetId,
  vehicleNo,
  initialData = [],
  initialSummary = {},
}) {
  const [activities, setActivities] = useState(initialData);
  const [summary, setSummary] = useState(initialSummary);
  const [activeCategory, setActiveCategory] = useState("all");
  const [datePreset, setDatePreset] = useState("all_time");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [moreCategoriesOpen, setMoreCategoriesOpen] = useState(false);

  const dateMenuRef = useRef(null);
  const moreCatRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
      if (moreCatRef.current && !moreCatRef.current.contains(e.target)) {
        setMoreCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch activities from API
  const fetchActivities = React.useCallback(async (currentPage = 1, category = activeCategory) => {
    if (!fleetId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("fleetId", String(fleetId));
      params.append("page", String(currentPage));
      params.append("limit", String(limit));

      if (category && category !== "all") {
        params.append("type", category.toUpperCase());
      }

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Date range filtering
      if (datePreset === "last_30_days") {
        params.append("fromDate", moment().subtract(30, "days").format("YYYY-MM-DD"));
        params.append("toDate", moment().format("YYYY-MM-DD"));
      } else if (datePreset === "last_90_days") {
        params.append("fromDate", moment().subtract(90, "days").format("YYYY-MM-DD"));
        params.append("toDate", moment().format("YYYY-MM-DD"));
      } else if (datePreset === "this_year") {
        params.append("fromDate", moment().startOf("year").format("YYYY-MM-DD"));
        params.append("toDate", moment().format("YYYY-MM-DD"));
      } else if (datePreset === "custom" && customFromDate) {
        params.append("fromDate", customFromDate);
        if (customToDate) params.append("toDate", customToDate);
      }

      const res = await fetch(`/api/fleet/history?${params.toString()}`);
      const result = await res.json();

      if (result?.status && Array.isArray(result.data)) {
        setActivities(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
        if (result.summary) {
          setSummary(result.summary);
        }
      }
    } catch (err) {
      console.error("Error fetching fleet activity history:", err);
    } finally {
      setLoading(false);
    }
  }, [fleetId, activeCategory, limit, searchTerm, datePreset, customFromDate, customToDate]);

  useEffect(() => {
    fetchActivities(page, activeCategory);
  }, [fetchActivities, page, activeCategory]);

  // Handle category change
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setPage(1);
  };

  // Group activities chronologically by date using UTC->local conversion
  const groupedActivities = useMemo(() => {
    const groups = {};
    (activities || []).forEach((act) => {
      const rawDate = act.performedAt || act.createdAt;
      const m = rawDate ? moment.utc(rawDate).local() : moment();
      const dateKey = m.format("YYYY-MM-DD");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(act);
    });

    // Sort descending
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((dateKey) => ({
        dateKey,
        formattedDate: moment(dateKey).format("DD MMM YYYY"),
        isToday: moment(dateKey).isSame(moment(), "day"),
        items: groups[dateKey],
      }));
  }, [activities]);

  // Visual formatting helper for category icons and colors
  const getCategoryStyles = (opType, action, entityType) => {
    const type = (opType || "").toUpperCase();
    const act = (action || "").toUpperCase();
    const entity = (entityType || "").toUpperCase();

    if (type === "DOCUMENT" || entity.includes("DOCUMENT") || entity === "INSURANCE" || entity === "PUC" || entity === "RC") {
      return {
        icon: FiFileText,
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600",
        borderColor: "border-purple-200/80",
        dotColor: "bg-purple-500 ring-purple-100",
      };
    }
    if (type === "DRIVER" || entity.includes("DRIVER")) {
      return {
        icon: FiUser,
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        borderColor: "border-emerald-200/80",
        dotColor: "bg-emerald-500 ring-emerald-100",
      };
    }
    if (type === "EMI" || entity.includes("EMI") || entity.includes("LOAN")) {
      return {
        icon: FiCreditCard,
        bgColor: "bg-pink-50",
        iconColor: "text-pink-600",
        borderColor: "border-pink-200/80",
        dotColor: "bg-pink-500 ring-pink-100",
      };
    }
    if (type === "MAINTENANCE" || entity.includes("MAINTENANCE") || act.includes("SERVICE")) {
      return {
        icon: FiTool,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        borderColor: "border-blue-200/80",
        dotColor: "bg-blue-500 ring-blue-100",
      };
    }
    if (type === "STATUS" || act === "ACTIVATE" || act === "DEACTIVATE" || entity === "STATUS_CHANGE") {
      return {
        icon: FiActivity,
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200/80",
        dotColor: "bg-amber-500 ring-amber-100",
      };
    }

    // Default Vehicle / Fleet info
    return {
      icon: HiOutlineTruck,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200/80",
      dotColor: "bg-indigo-500 ring-indigo-100",
    };
  };

  // Status/Action Badge Styles
  const getActionBadge = (action) => {
    const a = (action || "").toUpperCase();
    if (a === "CREATE" || a === "ASSIGN" || a === "UPLOADED" || a === "UPLOAD") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action === "ASSIGN" ? "Assigned" : action === "UPLOAD" ? "Uploaded" : "Created"}
        </span>
      );
    }
    if (a === "UPDATE" || a === "RENEW" || a === "REPLACE" || a === "UPDATED") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {action === "RENEW" ? "Renewed" : "Updated"}
        </span>
      );
    }
    if (a === "DELETE" || a === "UNASSIGN") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {action === "UNASSIGN" ? "Unassigned" : "Deleted"}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {action}
      </span>
    );
  };

  //  const categoryTabs = [
  //   { id: "all", label: "All", count: summary.all || activities.length },
  //   { id: "documents", label: "Documents", count: summary.documents || 0 },
  //   { id: "driver", label: "Driver", count: summary.driver || 0 },
  //   { id: "emi", label: "EMI", count: summary.emi || 0 },
  //   { id: "maintenance", label: "Maintenance", count: summary.maintenance || 0 },
  //   { id: "vehicle_details", label: "Vehicle Details", count: summary.vehicleDetails || 0 },
  //   { id: "status", label: "Status", count: summary.status || 0 },
  // ];


  const categoryTabs = [
    { id: "all", label: "All Activities", count: activities.length || summary.all || 0 },
  ];

  const dateFilterLabels = {
    all_time: "All Time",
    last_30_days: "Last 30 Days",
    last_90_days: "Last 90 Days",
    this_year: "This Year",
    custom: customFromDate ? `${customFromDate} - ${customToDate || "Now"}` : "Custom Date Range",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col">
      {/* Top Section: Title & Subtitle + Date Range Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <HiOutlineTruck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Activity History
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Complete history of all operations and changes for this fleet.
            </p>
          </div>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateMenuRef}>
          <button
            type="button"
            onClick={() => setDateDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <FiCalendar className="w-4 h-4 text-slate-500" />
            <span>{dateFilterLabels[datePreset] || "Date Range"}</span>
            <FiChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                dateDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                Filter by Date
              </div>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("all_time");
                  setDateDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  datePreset === "all_time"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                All Time (01 Jan 2025 - 25 Sep 2026)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("last_30_days");
                  setDateDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  datePreset === "last_30_days"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("last_90_days");
                  setDateDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  datePreset === "last_90_days"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Last 90 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("this_year");
                  setDateDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  datePreset === "this_year"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                This Year (2026)
              </button>

              <div className="border-t border-slate-100 my-1 pt-1 px-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Custom Range:
                </span>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset("custom");
                    setDateDropdownOpen(false);
                  }}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg text-center"
                >
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="py-4 border-b border-slate-100 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {categoryTabs.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => fetchActivities(page, activeCategory)}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Refresh activities"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
        </button>
      </div>

      {/* Main Activity Timeline Section */}
      <div className="py-6 flex-1">
        {loading ? (
          /* Skeleton Loading State */
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="w-28 h-4 bg-slate-200 rounded-md" />
                <div className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="w-1/3 h-4 bg-slate-200 rounded" />
                    <div className="w-1/2 h-3 bg-slate-200 rounded" />
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedActivities.length === 0 ? (
          /* Empty History State */
          <div className="py-14 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5 shadow-xs">
              <FiClock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No activity yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 leading-relaxed">
              Fleet activity will appear here when documents, drivers, EMI, maintenance, or vehicle details are changed.
            </p>
          </div>
        ) : (
          /* Chronological Timeline Groups */
          <div className="space-y-8">
            {groupedActivities.map((group) => (
              <div key={group.dateKey} className="relative">
                {/* Date Group Header */}
                <div className="flex items-center gap-2 mb-3.5 pl-6 sm:pl-7">
                  <div className="absolute left-[11px] sm:left-[13px] w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {group.formattedDate}
                  </span>
                  {group.isToday && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {/* Vertical Continuous Connecting Line */}
                <div className="absolute top-4 bottom-0 left-[15px] sm:left-[17px] w-0.5 bg-slate-200/80" />

                {/* Activity Cards List */}
                <div className="pl-6 sm:pl-7 space-y-3">
                  {group.items.map((activity) => {
                    const style = getCategoryStyles(
                      activity.operationType,
                      activity.action,
                      activity.entityType
                    );
                    const CategoryIcon = style.icon;
                    const rawTimestamp = activity.performedAt || activity.createdAt;
                    const formattedTime = rawTimestamp
                      ? moment.utc(rawTimestamp).local().format("hh:mm A")
                      : "";

                    return (
                      <div
                        key={activity.id}
                        onClick={() => {
                          setSelectedActivity(activity);
                          setDetailModalOpen(true);
                        }}
                        className="group relative bg-white hover:bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Timeline Node Dot */}
                        <div
                          className={`absolute -left-[19px] sm:-left-[15px] top-6 w-2 h-2 rounded-full ${style.dotColor} ring-4`}
                        />

                        {/* Left Side: Category Icon + Content */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${style.bgColor} ${style.borderColor} border flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            <CategoryIcon className={`w-5 h-5 ${style.iconColor}`} />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {activity.title}
                            </h4>

                            {activity.description && (
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {activity.description}
                              </p>
                            )}

                            {/* User Performer & Module */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                              {/* Avatar Initials */}
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                                {(activity.performedByName || "A").charAt(0).toUpperCase()}
                              </div>
                              <span className="text-slate-600">
                                By{" "}
                                <strong className="text-slate-800 font-semibold">
                                  {activity.performedByName || "Admin User"}
                                </strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 capitalize">
                                {activity.source || activity.operationType || "System"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Timestamp + Status Badge + Thumbnail / Menu */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 font-mono">
                              {formattedTime}
                            </span>
                            {getActionBadge(activity.action)}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Document thumbnail attachment preview if available */}
                            {activity.operationType === "DOCUMENT" && (
                              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                <FiFile className="w-3 h-3 text-purple-500" />
                                <span>Doc</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity(activity);
                                setDetailModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              title="View details"
                            >
                              <FiMoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Activity Detail Inspection Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
}
