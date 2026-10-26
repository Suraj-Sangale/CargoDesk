import React from "react";
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
} from "react-icons/fi";
import { HiOutlineTruck, HiOutlineDocumentText } from "react-icons/hi";

/**
 * Overview Tab Panel
 */
export function OverviewPanel({ fleet, onNavigateTab, onAddDocument }) {
  const status = (fleet?.status || "Active").toLowerCase();

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
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

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
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

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
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

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
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
}

/**
 * Documents Tab Panel
 */
export function DocumentsPanel({ fleet, onAddDocument, onEditDocument }) {
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
}

/**
 * EMI Tab Panel
 */
export function EmiPanel({ fleet }) {
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
}

/**
 * Driver Tab Panel
 */
export function DriverPanel({ fleet, onAssignDriver, onUnassignDriver }) {
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
}

/**
 * Maintenance Tab Panel
 */
export function MaintenancePanel({ fleet }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Maintenance & Service Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Periodic maintenance, repairs, and service records.
          </p>
        </div>
      </div>

      <div className="py-6 text-center text-slate-500 text-xs sm:text-sm">
        <p>Current vehicle status: <strong className="capitalize">{fleet?.status || "Active"}</strong>.</p>
      </div>
    </div>
  );
}
