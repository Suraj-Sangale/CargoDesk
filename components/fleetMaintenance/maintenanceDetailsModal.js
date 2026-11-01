"use client";

import React, { useState } from "react";
import moment from "moment";
import {
  FiCalendar,
  FiTool,
  FiDollarSign,
  FiShield,
  FiFileText,
  FiTrash2,
  FiEdit,
  FiExternalLink,
  FiPlay,
  FiX,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiImage,
  FiVideo,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { showToast } from "@/utilities/toastService";
import { postApiData } from "@/utilities/services/apiService";

export default function MaintenanceDetailsModal({
  record,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
}) {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaSignedUrls, setMediaSignedUrls] = useState({});
  const [loadingMediaId, setLoadingMediaId] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  if (!record) return null;

  // Fetch short-lived signed URL for viewing attachment
  const handleViewMedia = async (mediaItem) => {
    if (mediaSignedUrls[mediaItem.id]) {
      setSelectedMedia({
        ...mediaItem,
        signedUrl: mediaSignedUrls[mediaItem.id],
      });
      return;
    }

    setLoadingMediaId(mediaItem.id);
    try {
      const json = await postApiData("GET_MAINTENANCE_MEDIA_URL", {
        maintenanceId: record.id,
        mediaId: mediaItem.id,
      });
      if (json?.status && json?.data?.signedUrl) {
        setMediaSignedUrls((prev) => ({
          ...prev,
          [mediaItem.id]: json.data.signedUrl,
        }));
        setSelectedMedia({
          ...mediaItem,
          signedUrl: json.data.signedUrl,
        });
      } else {
        showToast({ message: json?.message || "Failed to load secure media URL", type: "error" });
      }
    } catch (err) {
      console.error("Error fetching signed URL:", err);
      showToast({ message: "Network error loading attachment preview", type: "error" });
    } finally {
      setLoadingMediaId(null);
    }
  };

  // Delete media attachment
  const handleDeleteMedia = async (mediaItem, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete attachment "${mediaItem.file_name}"?`)) {
      return;
    }

    setIsDeletingMedia(true);
    try {
      const json = await postApiData("DELETE_MAINTENANCE_MEDIA", {
        maintenanceId: record.id,
        mediaId: mediaItem.id,
      });
      if (json?.status) {
        showToast({ message: "Attachment deleted successfully", type: "success" });
        if (selectedMedia?.id === mediaItem.id) {
          setSelectedMedia(null);
        }
        if (onRefresh) onRefresh();
      } else {
        showToast({ message: json?.message || "Failed to delete attachment", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting attachment:", err);
      showToast({ message: "Failed to delete attachment", type: "error" });
    } finally {
      setIsDeletingMedia(false);
    }
  };

  // Quick status change handler
  const handleQuickStatus = async (newStatus) => {
    if (newStatus === record.status) return;
    setIsUpdatingStatus(true);
    try {
      const json = await postApiData("UPDATE_MAINTENANCE_RECORD", {
        id: record.id,
        status: newStatus,
      });
      if (json?.status) {
        showToast({ message: `Maintenance status updated to ${newStatus}`, type: "success" });
        if (onStatusChange) onStatusChange(newStatus);
        if (onRefresh) onRefresh();
      } else {
        showToast({ message: json?.message || "Failed to update status", type: "error" });
      }
    } catch (err) {
      showToast({ message: "Error updating status", type: "error" });
    } finally {
      setIsUpdatingStatus(false);
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
    <div className="p-5 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xl shadow-2xs">
            <FiTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{record.maintenance_type}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(record.status)}`}>
                {record.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vehicle {record.vehicle_number} {record.vehicle_model ? `(${record.vehicle_model})` : ""} •{" "}
              {moment(record.maintenance_date).format("DD MMM YYYY")}
            </p>
          </div>
        </div>

        {/* Status Changer Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {["Reported", "In Progress", "Completed", "Cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleQuickStatus(st)}
              disabled={isUpdatingStatus}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                record.status === st
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Cost</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block">
            ₹{Number(record.cost || 0).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block">Odometer</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block">
            {record.odometer_reading ? `${Number(record.odometer_reading).toLocaleString("en-IN")} KM` : "Not Recorded"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block">Garage / Vendor</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate" title={record.garage_name || "N/A"}>
            {record.garage_name || "Self / Workshop"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block">Invoice / Ref</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate" title={record.invoice_number || "N/A"}>
            {record.invoice_number || "None"}
          </span>
        </div>
      </div>

      {/* Description Block */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Work Description
        </h4>
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
          {record.description}
        </p>
      </div>

      {/* Additional Notes if any */}
      {record.additional_notes && (
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Notes & Remarks
          </h4>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
            {record.additional_notes}
          </p>
        </div>
      )}

      {/* Media Attachments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Photo & Video Evidence ({record.media?.length || 0})
          </h4>
          {/* <span className="text-[11px] text-slate-400 font-medium">
            Stored securely in Amazon S3 Mumbai (ap-south-1)
          </span> */}
        </div>

        {record.media && record.media.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {record.media.map((item) => {
              const isImg = item.media_type === "image" || item.mime_type?.startsWith("image/");
              const isLoadingThis = loadingMediaId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleViewMedia(item)}
                  className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all"
                >
                  <div className="w-full h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder icon before click */}
                    {isImg ? (
                      <FiImage className="w-8 h-8 text-slate-500 group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <FiPlay className="w-5 h-5 ml-0.5" />
                      </div>
                    )}

                    {/* Loading overlay */}
                    {isLoadingThis && (
                      <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white backdrop-blur-2xs">
                        <ImSpinner9 className="w-5 h-5 animate-spin" />
                      </div>
                    )}

                    {/* Media Type pill */}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white flex items-center gap-1 backdrop-blur-xs">
                      {isImg ? <FiImage className="w-2.5 h-2.5" /> : <FiVideo className="w-2.5 h-2.5" />}
                      <span>{isImg ? "IMAGE" : "VIDEO"}</span>
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteMedia(item, e)}
                      disabled={isDeletingMedia}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete attachment"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-2 bg-slate-50 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-800 truncate" title={item.file_name}>
                      {item.file_name}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium group-hover:underline">
                      Click to view
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No photos or videos attached to this record.
          </div>
        )}
      </div>

      {/* Lightbox / Media Viewer Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white border-b border-slate-800">
              <span className="text-xs font-semibold truncate max-w-md">
                {selectedMedia.file_name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedMedia.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Open in new window"
                >
                  <FiExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="p-2 flex items-center justify-center bg-black max-h-[75vh]">
              {selectedMedia.media_type === "image" || selectedMedia.mime_type?.startsWith("image/") ? (
                <img
                  src={selectedMedia.signedUrl}
                  alt={selectedMedia.file_name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedMedia.signedUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="text-[11px] text-slate-400">
          Created by: {record.created_by_name || "Admin"} • ID #{record.id}
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FiEdit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
