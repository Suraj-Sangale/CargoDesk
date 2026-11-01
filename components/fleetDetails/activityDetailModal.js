import React, { useState, useEffect } from "react";
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
  FiImage,
  FiVideo,
  FiEye,
  FiX,
  FiExternalLink,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import CommonModal from "../common/commonModal";
import { postApiData } from "@/utilities/services/apiService";

export default function ActivityDetailModal({ activity, isOpen, onClose }) {
  const [maintenanceMedia, setMaintenanceMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const {
    title = "",
    description = "",
    operationType = "",
    entityType = "",
    entityId = "",
    action = "",
    performedByName = "",
    performedBy = "",
    performedAt = "",
    source = "",
    changedFields = "",
    oldValue = "",
    newValue = "",
    metadata = "",
  } = activity || {};

  const rawTimestamp = performedAt || activity?.createdAt;
  const formattedDate = rawTimestamp
    ? moment.utc(rawTimestamp).local().format("DD MMM YYYY, hh:mm A")
    : "N/A";

  // Determine if this activity is related to fleet maintenance
  const isMaintenanceActivity =
    operationType === "MAINTENANCE" ||
    entityType === "MAINTENANCE_RECORD" ||
    source === "maintenance" ||
    Boolean(metadata?.maintenance_id) ||
    Boolean(metadata?.media?.length) ||
    Boolean(newValue?.media?.length);

  const maintenanceId =
    entityId ||
    entityId ||
    metadata?.maintenance_id ||
    metadata?.id ||
    newValue?.id ||
    oldValue?.id;

  // Load pictures/media for this maintenance entry
  useEffect(() => {
    if (!isOpen || !activity) return;

    // Check if media items are already present in metadata or newValue
    const embeddedMedia = metadata?.media || newValue?.media;
    if (Array.isArray(embeddedMedia) && embeddedMedia.length > 0) {
      setMaintenanceMedia(embeddedMedia);
    } else {
      setMaintenanceMedia([]);
    }

    // If it's a maintenance entry, fetch full record with fresh signed URLs
    if (isMaintenanceActivity && maintenanceId) {
      setLoadingMedia(true);
      postApiData("GET_MAINTENANCE_RECORD", { id: maintenanceId })
        .then((res) => {
          if (res?.status && res?.data?.media) {
            setMaintenanceMedia(res.data.media);
          }
        })
        .catch((err) => {
          console.error(
            "Error fetching maintenance pictures for audit detail:",
            err,
          );
        })
        .finally(() => {
          setLoadingMedia(false);
        });
    }
  }, [isOpen, activity, isMaintenanceActivity, maintenanceId]);

  const renderValue = (val) => {
    if (val === null || val === undefined)
      return <span className="text-slate-400 italic">None</span>;
    if (typeof val === "object") {
      return (
        <pre className="text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto max-h-40 font-mono">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <span className="font-semibold text-slate-800">{String(val)}</span>;
  };

  if (!activity) return null;

  return (
    <>
      <CommonModal
        modalOpen={isOpen}
        setModalOpen={onClose}
        modalTitle="Activity Audit Details"
        modalSize="w-11/12 md:w-[620px]"
      >
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* 1. Header Summary Box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FiClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                  {action}
                </span>
              </div>
              {description && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* 2. Uploaded Maintenance Picture(s) Below Title */}
          {isMaintenanceActivity && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FiImage className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Maintenance Pictures & Evidence
                  </h4>
                  {maintenanceMedia.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {maintenanceMedia.length}{" "}
                      {maintenanceMedia.length === 1 ? "Photo" : "Photos"}
                    </span>
                  )}
                </div>
                {maintenanceMedia.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Click picture to expand
                  </span>
                )}
              </div>

              {loadingMedia && maintenanceMedia.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-xl border border-slate-100">
                  <ImSpinner9 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">
                    Loading uploaded maintenance picture(s)...
                  </span>
                </div>
              ) : maintenanceMedia.length > 0 ? (
                <div
                  className={`grid gap-3 ${
                    maintenanceMedia.length === 1
                      ? "grid-cols-1"
                      : maintenanceMedia.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {/* [activityDetailModal.js#L188-188](fileLineRange;file:///f%3A/nextjs/cargodesk/components/fleetDetails/activityDetailModal.js#L188-188) to view  uploaded media donot open in modal open in new tab  */}
                  {maintenanceMedia.map((m, idx) => {
                    const isVideo =
                      m.media_type === "video" ||
                      m.mime_type?.startsWith("video/");
                    return (
                      <div
                        key={m.id || idx}
                        onClick={() => setPreviewMedia(m)}
                        className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-xs hover:border-blue-400 transition-all cursor-pointer"
                      >
                        {isVideo ? (
                          <div className="aspect-video w-full bg-slate-900 text-white flex flex-col items-center justify-center gap-1.5 p-3">
                            <FiVideo className="w-6 h-6 text-blue-400" />
                            <span className="text-[10px] text-slate-300 font-medium truncate max-w-full">
                              {m.file_name}
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`w-full bg-slate-100 relative overflow-hidden flex items-center justify-center ${
                              maintenanceMedia.length === 1
                                ? "h-48 sm:h-56"
                                : "aspect-4/3"
                            }`}
                          >
                            {m.signedUrl ? (
                              <img
                                src={m.signedUrl}
                                alt={m.file_name || "Maintenance evidence"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 gap-1 text-xs">
                                <FiImage className="w-6 h-6" />
                                <span className="text-[10px]">Photo</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="p-2 rounded-full bg-white/95 text-slate-800 shadow-md">
                                <FiEye className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between">
                          <p
                            className="text-[11px] font-semibold text-slate-700 truncate"
                            title={m.file_name}
                          >
                            {m.file_name || `Evidence #${idx + 1}`}
                          </p>
                          {m.file_size && (
                            <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                              {(m.file_size / 1024).toFixed(0)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 px-3 text-center rounded-xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs">
                  No pictures were attached to this maintenance record.
                </div>
              )}
            </div>
          )}

          {/* 3. Audit Meta Key-Values */}
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
              <span className="font-medium text-slate-800 mt-0.5 block">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* 4. Changed Fields Tags */}
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

          {/* 5. Diff Inspection: Old vs New Values */}
          {(oldValue || newValue) && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-700 block">
                Values Snapshot:
              </span>
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

          {/* 6. Extra Metadata if present */}
          {metadata && (
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-700 block mb-1.5">
                Payload Metadata:
              </span>
              <pre className="text-[11px] bg-slate-800 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono">
                {typeof metadata === "object"
                  ? JSON.stringify(metadata, null, 2)
                  : metadata}
              </pre>
            </div>
          )}

          {/* 7. Close Button */}
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

      {/* Lightbox / Zoom Modal for Clicked Image */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-900 border-b border-slate-800 text-white">
              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate">
                  {previewMedia.file_name}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Maintenance Evidence
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-black/60 max-h-[75vh] overflow-hidden">
              {previewMedia.media_type === "video" ||
              previewMedia.mime_type?.startsWith("video/") ? (
                <video
                  src={previewMedia.signedUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-lg shadow-lg"
                />
              ) : (
                <img
                  src={previewMedia.signedUrl}
                  alt={previewMedia.file_name}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
