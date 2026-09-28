import React from "react";
import moment from "moment";
import {
  FiClock,
  FiUser,
  FiActivity,
  FiFileText,
  FiTag,
  FiArrowRight,
  FiCheckCircle,
  FiInfo,
  FiShield,
  FiLayers,
} from "react-icons/fi";
import CommonModal from "../common/commonModal";

export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
}) {
  if (!activity) return null;

  const {
    title,
    description,
    operationType,
    entityType,
    entityId,
    action,
    performedByName,
    performedBy,
    performedAt,
    source,
    changedFields,
    oldValue,
    newValue,
    metadata,
  } = activity;

  const rawTimestamp = performedAt || activity.createdAt;
  const formattedDate = rawTimestamp
    ? moment.utc(rawTimestamp).local().format("DD MMM YYYY, hh:mm A")
    : "N/A";

  const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">None</span>;
    if (typeof val === "object") {
      return (
        <pre className="text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-40 font-mono">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <span className="font-semibold text-slate-800">{String(val)}</span>;
  };

  return (
    <CommonModal
      modalOpen={isOpen}
      setModalOpen={onClose}
      modalTitle="Activity Audit Details"
      modalSize="w-11/12 md:w-[560px]"
    >
      <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
        {/* Header Summary Box */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FiClock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                {action}
              </span>
            </div>
            {description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {/* Audit Meta Key-Values */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Module / Source
            </span>
            <span className="font-medium text-slate-800 capitalize mt-0.5 block">
              {source || operationType}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Entity Type
            </span>
            <span className="font-medium text-slate-800 uppercase mt-0.5 block">
              {entityType || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Performed By
            </span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {performedByName || `User #${performedBy || "1"}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Timestamp
            </span>
            <span className="font-medium text-slate-800 mt-0.5 block">{formattedDate}</span>
          </div>
        </div>

        {/* Changed Fields Tags */}
        {Array.isArray(changedFields) && changedFields.length > 0 && (
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Modified Fields ({changedFields.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {changedFields.map((field, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-mono font-medium"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Diff Inspection: Old vs New Values */}
        {(oldValue || newValue) && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 block">Values Snapshot:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1.5">
                  Previous State (Old)
                </span>
                {renderValue(oldValue)}
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1.5">
                  Updated State (New)
                </span>
                {renderValue(newValue)}
              </div>
            </div>
          </div>
        )}

        {/* Extra Metadata if present */}
        {metadata && (
          <div className="pt-1">
            <span className="text-xs font-bold text-slate-700 block mb-1.5">Payload Metadata:</span>
            <pre className="text-[11px] bg-slate-800 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono">
              {typeof metadata === "object" ? JSON.stringify(metadata, null, 2) : metadata}
            </pre>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </CommonModal>
  );
}
