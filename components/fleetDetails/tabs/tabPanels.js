import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import moment from "moment";
import {
  FiFileText,
  FiCreditCard,
  FiUser,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiPhone,
  FiShield,
  FiActivity,
  FiPlus,
  FiArrowRight,
  FiDollarSign,
  FiSearch,
  FiTrash2,
  FiEdit,
  FiEye,
  FiImage,
  FiVideo,
  FiFilter,
  FiClock,
  FiCamera,
  FiDownload,
  FiPrinter,
} from "react-icons/fi";
import {
  exportVehicleOverviewCsv,
  exportVehicleOverviewPdf,
  exportMaintenanceHistoryCsv,
  exportMaintenanceHistoryPdf,
} from "@/utilities/exportUtils";
import { HiOutlineTruck, HiOutlineDocumentText } from "react-icons/hi";
import { ImSpinner9 } from "react-icons/im";
import CommonModal from "../../common/commonModal";
import CommonConfirmation from "../../common/items/commonConfirmation";
import MaintenanceForm, { MaintenanceFormV2 } from "../../fleetMaintenance/maintenanceForm";
import MaintenanceDetailsModal from "../../fleetMaintenance/maintenanceDetailsModal";
import {
  FLEET_MAINTENANCE_TYPES,
  FLEET_MAINTENANCE_STATUSES,
} from "@/utilities/masterData";
import { showToast } from "@/utilities/toastService";
import { postApiData, swrPostApiData, invalidateApiCache } from "@/utilities/services/apiService";

/**
 * Overview Tab Panel
 */
export const OverviewPanel = React.memo(function OverviewPanel({ fleet, summary = {}, onNavigateTab, onAddDocument }) {
  const status = (fleet?.status || "Active").toLowerCase();

  const loggedInUser =
    typeof window !== "undefined"
      ? window.__NEXT_DATA__?.props?.pageData?.user
      : null;

  const exportSummary = useMemo(() => ({
    ...summary,
    orgName:
      loggedInUser?.orgName ||
      loggedInUser?.organization_name ||
      fleet?.organization_name ||
      fleet?.orgName ||
      fleet?.orgCode ||
      summary?.orgName ||
      "",
    organization_name:
      loggedInUser?.orgName ||
      loggedInUser?.organization_name ||
      fleet?.organization_name ||
      fleet?.orgName ||
      fleet?.orgCode ||
      summary?.organization_name ||
      "",
  }), [summary, fleet?.organization_name, fleet?.orgName, fleet?.orgCode, loggedInUser?.orgName, loggedInUser?.organization_name]);

  return (
    <div className="space-y-6">
      {/* Top Overview Bar with Export Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Vehicle Overview & Health</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational profile and technical specifications for {fleet?.vehicle_number || "this vehicle"}.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              exportVehicleOverviewCsv(fleet, exportSummary);
              showToast({ message: "Vehicle overview CSV downloaded", type: "success" });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Download CSV / Excel report"
          >
            <FiDownload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportVehicleOverviewPdf(fleet, exportSummary)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <FiPrinter className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vehicle Status
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                status === "active" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 capitalize">
            {fleet?.status || "Active"}
          </div>
          <p className="text-xs text-slate-400 mt-1">Operational state</p>
        </div>

        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Documents
            </span>
            <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {fleet?.counts?.documents || 0} Registered
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("documents")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1 inline-flex items-center gap-1"
          >
            View all documents <FiArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Driver
            </span>
            <FiUser className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {fleet?.driver_name || "No Driver Assigned"}
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("driver")}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-1 inline-flex items-center gap-1"
          >
            Manage driver <FiArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Financing & EMI
            </span>
            <FiCreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {fleet?.counts?.emi || 0} Active Loans
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("emi")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center gap-1"
          >
            View EMI schedule <FiArrowRight className="w-3 h-3" />
          </button>
        </div>
        {fleet?.gps_tracking_id && <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GPS Tracking ID
            </span>
            <FiCreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">
            {fleet?.gps_tracking_id}
          </div>
        </div>}
      </div>

      {/* Vehicle Operational Notes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Fleet Vehicle Overview & Notes</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {fleet?.notes ||
            "Assigned for commercial logistics operations. All regular services, insurance, and fitness compliance certificates are monitored under CargoDesk fleet system."}
        </p>
      </div>
    </div>
  );
});

/**
 * Documents Tab Panel
 */
export const DocumentsPanel = React.memo(function DocumentsPanel({ fleet, onAddDocument, onEditDocument }) {
  const documents = Array.isArray(fleet?.documents) ? fleet.documents : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Vehicle Documents</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {documents.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance certificates, insurance, PUC, permit, and fitness records for vehicle {fleet?.vehicle_number || ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddDocument}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => {
            const expMoment = doc.expiryDate ? moment(doc.expiryDate) : null;
            const isExpired = expMoment && expMoment.isBefore(moment(), "day");
            const daysLeft = expMoment ? expMoment.diff(moment(), "days") : null;
            const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

            const docTypeUpper = (doc.documentType || "DOCUMENT").toUpperCase();

            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{docTypeUpper}</h4>
                      <p className="text-xs text-slate-500">Doc ID: #{doc.id}</p>
                    </div>
                  </div>

                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <FiAlertCircle className="w-3 h-3" /> Expired
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <FiAlertCircle className="w-3 h-3" /> {daysLeft}d left
                    </span>
                  ) : expMoment ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FiCheckCircle className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      No Expiry
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <FiCalendar className="w-3 h-3 text-slate-400" />
                      {expMoment ? expMoment.format("DD MMM YYYY") : "Permanent / None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Alert Threshold</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">
                      {doc.alertDate ? moment(doc.alertDate).format("DD MMM YYYY") : "30 Days Prior"}
                    </span>
                  </div>
                </div>

                {doc.note && (
                  <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                    &ldquo;{doc.note}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <FiFileText className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Documents Uploaded Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Upload vehicle registration, insurance, PUC, permit, or fitness certificates for vehicle {fleet?.vehicle_number}.
          </p>
          <button
            type="button"
            onClick={onAddDocument}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * EMI Tab Panel
 */
export const EmiPanel = React.memo(function EmiPanel({ fleet }) {
  const emis = Array.isArray(fleet?.emis) ? fleet.emis : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Loan & EMI Financing</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {emis.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active finance plans, monthly installments, and payment schedules for {fleet?.vehicle_number}.
          </p>
        </div>
      </div>

      {emis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emis.map((emi) => {
            // const isPaid = (emi?.status || "").toLowerCase() === "paid" || emi.status === "Completed";
            const isPaid = "paid";
            return (
              <div
                key={emi.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                      <FiCreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {emi.loan_name || emi.bank_name || "Vehicle Finance"}
                      </h4>
                      <p className="text-xs text-slate-500">A/C: {emi.loan_account_no || "N/A"}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {emi.status || "Active"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monthly EMI</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      ₹{Number(emi.emi_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Loan</span>
                    <span className="text-sm font-bold text-slate-700 mt-0.5 block">
                      ₹{Number(emi.loan_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Due Date</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <FiCalendar className="w-3 h-3 text-slate-400" />
                      {emi.due_date ? moment(emi.due_date).format("DD MMM YYYY") : "Monthly"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tenure Progress</span>
                    <span className="font-semibold text-slate-700 mt-0.5 block">
                      {emi.emis_paid || 0} / {emi.tenure_months || 0} Months
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <FiCreditCard className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No EMI Records Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No active finance or EMI loans linked to vehicle {fleet?.vehicle_number}.
          </p>
        </div>
      )}
    </div>
  );
});

/**
 * Driver Tab Panel
 */
export const DriverPanel = React.memo(function DriverPanel({ fleet, onAssignDriver, onUnassignDriver }) {
  const hasDriver = Boolean(fleet?.driver_name);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Assigned Driver</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Primary driver allocated to operate vehicle {fleet?.vehicle_number}.
          </p>
        </div>
        {hasDriver && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAssignDriver}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FiUser className="w-3.5 h-3.5" />
              <span>Change Driver</span>
            </button>
            {onUnassignDriver && (
              <button
                type="button"
                onClick={onUnassignDriver}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Unassign</span>
              </button>
            )}
          </div>
        )}
      </div>

      {hasDriver ? (
        <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              {fleet.driver_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{fleet.driver_name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active On Fleet
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                <span>{fleet.driver_contact || "No Contact Number"}</span>
              </p>
              {fleet.driver_license_number && (
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <FiShield className="w-3.5 h-3.5 text-slate-400" />
                  <span>License: {fleet.driver_license_number}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <FiUser className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Driver Currently Assigned</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Vehicle {fleet?.vehicle_number} does not have an active driver assigned to it.
          </p>
          <button
            type="button"
            onClick={onAssignDriver}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FiUser className="w-4 h-4" />
            <span>Assign Driver Now</span>
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * Maintenance Tab Panel
 * Complete maintenance history, summary metrics, filtering, and media management for the vehicle.
 */
export const MaintenancePanel = React.memo(function MaintenancePanel({ fleet, onRefreshFleet }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    total_records: 0,
    total_expenditure: 0,
    last_maintenance_date: null,
    latest_status: "No Records",
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportMenuRef = useRef(null);
  const requestIdRef = useRef(0);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportMenuOpen]);

  // Debounce search query input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch maintenance records and vehicle summary with SWR cache and race-condition guard
  const fetchMaintenance = useCallback(
    async (targetPage = 1, forceRefresh = false) => {
      if (!fleet?.id) return;
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const payload = {
          vehicleId: fleet.id,
          page: targetPage,
          limit: 10,
        };
        if (statusFilter !== "all") payload.status = statusFilter;
        if (typeFilter !== "all") payload.maintenance_type = typeFilter;
        if (debouncedSearch !== "") payload.search = debouncedSearch;

        // Use swrPostApiData for instant tab switching (0 ms cache hit)
        const json = await swrPostApiData("GET_VEHICLE_MAINTENANCE", payload, {
          ttl: 60000,
          force: forceRefresh,
          onRevalidate: (freshRes) => {
            if (currentRequestId === requestIdRef.current && freshRes?.status) {
              setRecords(Array.isArray(freshRes.data) ? freshRes.data : []);
              if (freshRes.summary) {
                setSummary(freshRes.summary);
              }
              if (freshRes.pagination) {
                setPage(freshRes.pagination.page);
                setTotalPages(freshRes.pagination.totalPages || 1);
              }
            }
          },
        });

        // Only commit if this is still the active request
        if (currentRequestId === requestIdRef.current && json?.status) {
          setRecords(Array.isArray(json.data) ? json.data : []);
          if (json.summary) {
            setSummary(json.summary);
          }
          if (json.pagination) {
            setPage(json.pagination.page);
            setTotalPages(json.pagination.totalPages || 1);
          }
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          console.error("Error loading maintenance records:", err);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fleet?.id, statusFilter, typeFilter, debouncedSearch]
  );

  // Trigger fetch when vehicle, filters, or debounced search change (resets to page 1)
  useEffect(() => {
    fetchMaintenance(1);
  }, [fetchMaintenance]);

  // Handle Search on Enter (immediate execution)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery.trim());
  };

  // 1. OPTIMISTIC DELETE (0 API calls on success)
  const handleDeleteRecord = (record) => {
    setRecordToDelete(record);
  };

  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete?.id) return;
    const deletedId = recordToDelete.id;
    const deletedCost = Number(recordToDelete.cost || 0);

    try {
      const json = await postApiData("DELETE_MAINTENANCE_RECORD", { id: deletedId });
      if (json?.status) {
        showToast({ message: "Maintenance record deleted successfully", type: "success" });

        // Optimistically remove from state
        setRecords((prev) => prev.filter((r) => r.id !== deletedId));

        // Optimistically update summary metrics
        setSummary((prev) => ({
          ...prev,
          total_records: Math.max(0, (Number(prev.total_records) || 0) - 1),
          total_expenditure: Math.max(0, (Number(prev.total_expenditure) || 0) - deletedCost),
        }));

        if (selectedRecordForDetails?.id === deletedId) {
          setSelectedRecordForDetails(null);
        }
        setRecordToDelete(null);
        invalidateApiCache("GET_VEHICLE_MAINTENANCE");
      } else {
        showToast({ message: json?.message || "Failed to delete record", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      showToast({ message: "Network error while deleting record", type: "error" });
    }
  };

  // 2. OPTIMISTIC EDIT (0 API calls on success)
  const handleEditSuccess = (updatedRecord) => {
    setSelectedRecordForEdit(null);
    if (!updatedRecord?.id) {
      fetchMaintenance(page, true);
      return;
    }

    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? { ...r, ...updatedRecord } : r))
    );

    if (selectedRecordForDetails?.id === updatedRecord.id) {
      setSelectedRecordForDetails((prev) => (prev ? { ...prev, ...updatedRecord } : null));
    }

    invalidateApiCache("GET_VEHICLE_MAINTENANCE");
  };

  // 3. OPTIMISTIC ADD / QUICK REPORT (0 API calls on success)
  const handleAddSuccess = (newRecord) => {
    setIsAddModalOpen(false);
    setIsQuickReportOpen(false);

    if (!newRecord?.id) {
      fetchMaintenance(1, true);
      return;
    }

    // Prepend new record to top of list
    setRecords((prev) => [newRecord, ...prev]);

    // Optimistically update summary metrics
    setSummary((prev) => ({
      ...prev,
      total_records: (Number(prev.total_records) || 0) + 1,
      total_expenditure: (Number(prev.total_expenditure) || 0) + Number(newRecord.cost || 0),
      last_maintenance_date: newRecord.maintenance_date || prev.last_maintenance_date,
      latest_status: newRecord.status || prev.latest_status,
    }));

    invalidateApiCache("GET_VEHICLE_MAINTENANCE");
  };

  // 4. OPTIMISTIC STATUS CHANGE (0 extra API calls)
  const handleDetailsStatusChange = (newStatus) => {
    if (!selectedRecordForDetails?.id) return;
    const recId = selectedRecordForDetails.id;

    setSelectedRecordForDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
    setRecords((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
    );

    invalidateApiCache("GET_VEHICLE_MAINTENANCE");
  };

  // 5. SINGLE-RECORD REFRESH (Only when attachments change in details modal)
  const handleDetailsRefresh = async () => {
    if (!selectedRecordForDetails?.id) return;
    try {
      const json = await postApiData("GET_MAINTENANCE_RECORD", { id: selectedRecordForDetails.id });
      if (json?.status && json?.data) {
        setSelectedRecordForDetails(json.data);
        setRecords((prev) =>
          prev.map((r) => (r.id === json.data.id ? json.data : r))
        );
      }
    } catch (_) {}
    invalidateApiCache("GET_VEHICLE_MAINTENANCE");
  };

  // 6. OPTIMIZED EXPORT (Reuses in-memory records when possible)
  const handleExportMaintenance = async (exportFormat = "csv") => {
    if (!fleet?.id) return;
    setIsExporting(true);
    try {
      showToast({ message: `Preparing maintenance ${exportFormat.toUpperCase()} report...`, type: "info" });

      let exportList = records;
      // Only hit the API if total records exceed the currently loaded page
      if (Number(summary.total_records || 0) > records.length) {
        const payload = {
          vehicleId: fleet.id,
          exportAll: true,
          limit: 2000,
        };
        if (statusFilter !== "all") payload.status = statusFilter;
        if (typeFilter !== "all") payload.maintenance_type = typeFilter;
        if (debouncedSearch !== "") payload.search = debouncedSearch;

        const json = await postApiData("GET_VEHICLE_MAINTENANCE", payload);
        if (json?.status && Array.isArray(json.data)) {
          exportList = json.data;
        }
      }

      const loggedInUser =
        typeof window !== "undefined"
          ? window.__NEXT_DATA__?.props?.pageData?.user
          : null;

      const exportSummary = {
        ...summary,
        orgName:
          loggedInUser?.orgName ||
          loggedInUser?.organization_name ||
          fleet?.organization_name ||
          fleet?.orgName ||
          fleet?.orgCode ||
          summary?.orgName ||
          "",
      };

      if (exportFormat === "csv") {
        exportMaintenanceHistoryCsv(exportList, fleet, exportSummary);
        showToast({ message: "Maintenance history CSV downloaded successfully", type: "success" });
      } else {
        exportMaintenanceHistoryPdf(exportList, fleet, exportSummary);
      }
    } catch (err) {
      console.error("Export error:", err);
      showToast({ message: "Failed to export maintenance records", type: "error" });
    } finally {
      setIsExporting(false);
      setExportMenuOpen(false);
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
    <div className="space-y-6">
      {/* 1. Summary Cards Section */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Services
            </span>
            <div className="desktopOnly w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiTool className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex md:flex-row flex-col items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.total_records}</span>
            <span className="desktopOnly text-xs text-slate-500 font-medium">Logged Entries</span>
          </div>
        </div>

        {/* Total Expenditure */}
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Expense
            </span>
            <div className="desktopOnly w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex md:flex-row flex-col items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{Number(summary.total_expenditure || 0).toLocaleString("en-IN")}
            </span>
            <span className="desktopOnly text-xs text-slate-500 font-medium">Maintenance Cost</span>
          </div>
        </div>

        {/* Last Maintenance Date */}
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Last Service
            </span>
            <div className="desktopOnly w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiCalendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 truncate">
              {summary.last_maintenance_date
                ? moment(summary.last_maintenance_date).format("DD MMM YYYY")
                : "None Recorded"}
            </span>
          </div>
        </div>

        {/* Current / Latest Status */}
        <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Latest Status
            </span>
            <div className="desktopOnly w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[8px] md:text-[10px] px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(summary.latest_status)}`}>
              {summary.latest_status}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Actions Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:items-startd justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search description, garage, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium"
            />
            <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <FiFilter className="w-3 h-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {FLEET_MAINTENANCE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Categories</option>
              {FLEET_MAINTENANCE_TYPES.map((tp) => (
                <option key={tp.type} value={tp.type}>
                  {tp.type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Export, Quick Report V2 & Full Log Form */}
        <div className="flex items-center gap-2">
          {/* Export Maintenance History Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Export maintenance history report"
            >
              {isExporting ? (
                <ImSpinner9 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <FiDownload className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-slate-400 px-3.5 py-1 uppercase tracking-wider">
                  Maintenance Export
                </div>
                <button
                  type="button"
                  onClick={() => handleExportMaintenance("csv")}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FiFileText className="w-4 h-4 text-emerald-600" />
                  <span>Export as CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportMaintenance("pdf")}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FiPrinter className="w-4 h-4 text-blue-600" />
                  <span>Export as PDF (Print)</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsQuickReportOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            title="Ultra-simple mobile report with camera & voice"
          >
            <FiCamera className="w-3.5 h-3.5" />
            <span>Quick Report (V2)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <FiPlus className="w-4 h-4" />
            <span>Log Maintenance</span>
          </button>
        </div>
      </div>

      {/* 3. Maintenance Records List */}
      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80">
          <ImSpinner9 className="w-7 h-7 text-blue-600 animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading maintenance records...</p>
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-3">
          {records.map((item) => (
            <div
  key={item.id}
  onClick={() => setSelectedRecordForDetails(item)}
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
                      <h4 className="text-sm font-bold text-slate-900">{item.maintenance_type}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                        {moment(item.maintenance_date).format("DD MMM YYYY")}
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
                  <div>
                    {/* <span className="text-[11px] font-semibold text-slate-400 block">Expense</span> */}
                    <span className="text-sm font-bold text-slate-900">
                      ₹{Number(item.cost || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {item.odometer_reading && (
                    <div className="pl-3 border-l border-slate-200/80">
                      <span className="text-[11px] font-semibold text-slate-400 block">Odometer</span>
                      <span className="text-xs font-bold text-slate-700">
                        {Number(item.odometer_reading).toLocaleString("en-IN")} KM
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Snippet */}
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {item.description}
              </p>

              {/* Attachments & Card Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {/* Media Thumbnails Snippet */}
                {item.media && item.media.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <FiImage className="w-3 h-3 text-blue-500" />
                      <span>{item.media.length} Attachment{item.media.length > 1 ? "s" : ""}:</span>
                    </span>
                    {item.media.slice(0, 4).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedRecordForDetails(item)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer truncate max-w-[130px]"
                        title={m.file_name}
                      >
                        {m.media_type === "video" || m.mime_type?.startsWith("video/") ? (
                          <FiVideo className="w-3 h-3 text-purple-600 shrink-0" />
                        ) : (
                          <FiImage className="w-3 h-3 text-blue-600 shrink-0" />
                        )}
                        <span className="truncate">{m.file_name}</span>
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
                  {/* <button
                    type="button"
                    onClick={() => setSelectedRecordForDetails(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FiEye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View</span>
                  </button> */}

                  <button
                    type="button"
                   onClick={(e) => {
  e.stopPropagation();
  setSelectedRecordForEdit(item);
}}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FiEdit className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecord(item);
                    }}
                    className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="desktopOnly text-xs text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => fetchMaintenance(page - 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => fetchMaintenance(page + 1)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="py-14 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <FiTool className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Maintenance Records Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            {statusFilter !== "all" || typeFilter !== "all" || searchQuery
              ? "No maintenance records match your current filter criteria."
              : `Keep vehicle ${fleet?.vehicle_number} in peak operational shape by logging regular services, repairs, and inspections.`}
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setIsQuickReportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FiCamera className="w-4 h-4" />
              <span>Quick Report (V2)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Log Standard Maintenance</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Report V2 Modal */}
      {isQuickReportOpen && (
        <CommonModal
          modalOpen={isQuickReportOpen}
          setModalOpen={setIsQuickReportOpen}
          modalTitle="Quick Report — Maintenance V2"
          modalSize="w-11/12 md:w-[600px]"
        >
          <MaintenanceFormV2
            preselectedVehicle={fleet}
            onClose={() => setIsQuickReportOpen(false)}
            onSuccess={handleAddSuccess}
          />
        </CommonModal>
      )}

      {/* Add Maintenance Modal */}
      {isAddModalOpen && (
        <CommonModal
          modalOpen={isAddModalOpen}
          setModalOpen={setIsAddModalOpen}
          modalTitle={`Log Maintenance for ${fleet?.vehicle_number || "Vehicle"}`}
          modalSize="w-11/12 md:w-[700px]"
        >
          <MaintenanceForm
            preselectedVehicle={fleet}
            isEdit={false}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleAddSuccess}
          />
        </CommonModal>
      )}

      {/* Edit Maintenance Modal */}
      {selectedRecordForEdit && (
        <CommonModal
          modalOpen={Boolean(selectedRecordForEdit)}
          setModalOpen={() => setSelectedRecordForEdit(null)}
          modalTitle={`Edit Maintenance Record #${selectedRecordForEdit.id}`}
          modalSize="w-11/12 md:w-[700px]"
        >
          <MaintenanceForm
            preselectedVehicle={fleet}
            initialData={selectedRecordForEdit}
            isEdit={true}
            onClose={() => setSelectedRecordForEdit(null)}
            onSuccess={handleEditSuccess}
          />
        </CommonModal>
      )}

      {/* View Details Modal with Lightbox */}
      {selectedRecordForDetails && (
        <CommonModal
          modalOpen={Boolean(selectedRecordForDetails)}
          setModalOpen={() => setSelectedRecordForDetails(null)}
          modalTitle={`Maintenance Details - ${selectedRecordForDetails.maintenance_type}`}
          modalSize="w-11/12 md:w-[750px]"
        >
          <MaintenanceDetailsModal
            record={selectedRecordForDetails}
            onClose={() => setSelectedRecordForDetails(null)}
            onEdit={(rec) => {
              setSelectedRecordForDetails(null);
              setSelectedRecordForEdit(rec);
            }}
            onDelete={handleDeleteRecord}
            onStatusChange={handleDetailsStatusChange}
            onRefresh={handleDetailsRefresh}
          />
        </CommonModal>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <CommonModal
          modalOpen={Boolean(recordToDelete)}
          setModalOpen={(open) => {
            if (!open) setRecordToDelete(null);
          }}
          modalTitle="Delete Confirmation"
          modalSize="w-11/12 md:w-[480px]"
        >
          <CommonConfirmation
            title={`Are you sure you want to permanently delete this ${recordToDelete.maintenance_type || "maintenance"} record and its attachments?`}
            confirmText="Yes"
            cancelText="No"
            onConfirm={handleConfirmDeleteRecord}
            onCancel={() => setRecordToDelete(null)}
          />
        </CommonModal>
      )}
    </div>
  );
});

