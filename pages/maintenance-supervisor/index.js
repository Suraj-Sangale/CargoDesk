"use client";

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import moment from "moment";
import MaintenanceFormV2 from "@/components/fleetMaintenance/maintenanceFormV2";
import { withUserSsr } from "@/utilities/withUserSsr";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import {
  FiTruck,
  FiLogOut,
  FiClock,
  FiCheckCircle,
  FiCamera,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiTool,
  FiUser,
  FiFileText,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import Image from "next/image";

export default function MaintenanceSupervisorPage({ pageData }) {
  const user = pageData?.user || null;
  const [recentRecords, setRecentRecords] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState(null);

  // Fetch latest 5 maintenance records
  const fetchRecentRecords = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await postApiData("GET_RECENT_MAINTENANCE", { limit: 5 });
      if (res?.status && Array.isArray(res.data)) {
        setRecentRecords(res.data);
      }
    } catch (err) {
      console.error("Error fetching recent maintenance records:", err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentRecords();
  }, [fetchRecentRecords]);

  // Handle successful maintenance record submission
  const handleRecordSuccess = (record) => {
    setLastSubmittedRecord(record);
    fetchRecentRecords();
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await postApiData("LOGOUT_USER");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <>
      <Head>
        <title>Vehicle Maintenance | CargoDesk Garage Portal</title>
        <meta
          name="description"
          content="CargoDesk simplified mobile maintenance entry portal for garage staff and maintenance supervisors."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
        {/* ============================================================
            1. Clean Mobile-First Header
            ============================================================ */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
          <div className="w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
            {/* Brand Logo & Page Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight truncate">
                  Vehicle Maintenance
                </h1>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide truncate">
                  CargoDesk Workshop
                </p>
              </div>
            </div>

            {/* Supervisor Info & Logout Action */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ""}`.trim()
                    : user?.email || "Supervisor"}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Supervisor
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold border border-rose-200 transition-all cursor-pointer min-h-[42px]"
                title="Logout from CargoDesk"
                aria-label="Logout"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="text-xs">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ============================================================
            2. Main Content Container (Full Width Responsive)
            ============================================================ */}
        <main className="flex-1 w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-0 sm:px-4 md:px-6 py-0 sm:py-6 space-y-3.5 sm:space-y-5">
          {/* Success Banner (displayed after submitting a record) */}
          {lastSubmittedRecord && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <FiCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Maintenance Record Saved Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Record #{lastSubmittedRecord.id} has been securely logged.
                    You can immediately enter the next vehicle problem below.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastSubmittedRecord(null)}
                className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Primary Form Card */}
          <div className="w-full bg-white rounded-b-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm relative">
            {/* Visual Quick Banner */}
            {/* <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiTool className="w-4 h-4 text-blue-200" />
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  New Maintenance Log
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Quick 1-Min Form
              </span>
            </div> */}

            {/* Direct V2 Maintenance Form */}
            <MaintenanceFormV2
              onSuccess={handleRecordSuccess}
              resetOnSuccess={true}
              submitButtonText="Save Maintenance Record"
            />
          </div>

          {/* ============================================================
              3. Recent Maintenance Records Section (Collapsed by default on mobile)
              ============================================================ */}
          <div className="bg-white rounded-t-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRecent((prev) => !prev)}
              className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              aria-expanded={showRecent}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                  <FiClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Recent Maintenance Logs
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Latest {recentRecords.length} recorded vehicle entries
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {recentRecords.length}
                </span>
                {showRecent ? (
                  <FiChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Collapsible Content */}
            {showRecent && (
              <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2">
                  <span>Recently Logged Garage Entries</span>
                  <button
                    type="button"
                    onClick={fetchRecentRecords}
                    disabled={loadingRecent}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold cursor-pointer disabled:opacity-50"
                  >
                    <FiRefreshCw
                      className={`w-3 h-3 ${loadingRecent ? "animate-spin" : ""}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingRecent && recentRecords.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <ImSpinner9 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-medium">
                      Loading recent logs...
                    </span>
                  </div>
                ) : recentRecords.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentRecords.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 font-mono truncate">
                              {item.vehicle_number || "Vehicle"}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">
                              {item.vehicle_model || ""}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                              item.status,
                            )}`}
                          >
                            {item.status || "Reported"}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-slate-400" />
                            {moment(
                              item.created_at || item.maintenance_date,
                            ).format("DD MMM YYYY, hh:mm A")}
                          </span>

                          <div className="flex items-center gap-2">
                            {Number(item.media_count || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                <FiCamera className="w-3 h-3" />
                                <span>{item.media_count} Media</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                No media
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500">
                              #{item.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No recent maintenance records found.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ============================================================
            4. Minimal Footer
            ============================================================ */}
        <footer className="py-5 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
          <p className="font-semibold text-slate-500">Powered by CargoDesk</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Transport & Fleet Management System
          </p>
        </footer>
      </div>
    </>
  );
}

// Dedicated standalone mobile-first layout: bypasses regular sidebar and dashboard header
MaintenanceSupervisorPage.layoutName = "none";

export const getServerSideProps = withUserSsr(
  async (context, { user }) => {
    return {
      props: {
        pageData: { user },
      },
    };
  },
  { allowedRoles: ["maintenance_supervisor", "admin", "super_admin"] },
);
