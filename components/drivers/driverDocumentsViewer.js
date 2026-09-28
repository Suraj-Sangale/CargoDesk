import React, { useState } from "react";
import {
  FiFileText,
  FiFile,
  FiEye,
  FiDownload,
  FiExternalLink,
  FiUser,
  FiTruck,
  FiShield,
  FiCalendar,
  FiEdit2,
  FiImage,
  FiInfo,
  FiCheckCircle,
} from "react-icons/fi";

export default function DriverDocumentsViewer({
  driver,
  onClose,
  onEdit,
}) {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  if (!driver) return null;

  // Safe parsing of supporting documents
  let docs = [];
  if (driver.supporting_documents) {
    if (Array.isArray(driver.supporting_documents)) {
      docs = driver.supporting_documents;
    } else if (typeof driver.supporting_documents === "string") {
      try {
        const parsed = JSON.parse(driver.supporting_documents);
        docs = Array.isArray(parsed) ? parsed : [driver.supporting_documents];
      } catch (_) {
        docs = [{ name: "Supporting Document", dataUrl: driver.supporting_documents }];
      }
    }
  }

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const activeDoc = docs[selectedDocIndex] || docs[0];

  const getDocType = (doc) => {
    if (!doc) return "other";
    const type = doc.type || "";
    const name = doc.name || "";
    const dataUrl = doc.dataUrl || "";
    if (type.startsWith("image/") || dataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) {
      return "image";
    }
    if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf") || dataUrl.startsWith("data:application/pdf")) {
      return "pdf";
    }
    return "other";
  };

  const activeDocType = activeDoc ? getDocType(activeDoc) : "other";

  const handleDownload = (doc) => {
    if (!doc || !doc.dataUrl) return;
    const link = document.createElement("a");
    link.href = doc.dataUrl;
    link.download = doc.name || "driver_document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = (doc) => {
    if (!doc || !doc.dataUrl) return;
    const win = window.open();
    if (win) {
      if (getDocType(doc) === "image") {
        win.document.write(`<title>${doc.name || "Document"}</title><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#0f172a;min-height:100vh;"><img src="${doc.dataUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body>`);
      } else if (getDocType(doc) === "pdf") {
        win.document.write(`<title>${doc.name || "Document"}</title><body style="margin:0;height:100vh;"><iframe src="${doc.dataUrl}" style="width:100%;height:100%;border:none;"></iframe></body>`);
      } else {
        win.location.href = doc.dataUrl;
      }
    }
  };

  return (
    <div className="px-5 md:px-6 space-y-5">
      {/* 1. Driver Summary Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-100/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          {/* Driver Avatar */}
          <div className="relative shrink-0">
            {driver.profile_photo ? (
              <img
                src={driver.profile_photo}
                alt={driver.driver_name || "Driver"}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-2xs">
                {(driver.driver_name || "D")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>

          {/* Driver Details */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {driver.driver_name || "Driver Details"}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <span>{docs.length}</span>
                <span>{docs.length === 1 ? "Document" : "Documents"}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1">
              {driver.license_number && (
                <span className="flex items-center gap-1 font-mono uppercase bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                  <FiShield className="w-3 h-3 text-purple-600" />
                  <span>{driver.license_number}</span>
                </span>
              )}
              {driver.assigned_vehicle && (
                <span className="flex items-center gap-1 font-semibold uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                  <FiTruck className="w-3 h-3 text-blue-600" />
                  <span>{driver.assigned_vehicle}</span>
                </span>
              )}
              {driver.contact_number && (
                <span>📞 {driver.contact_number}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Edit Driver */}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(driver)}
            className="self-end sm:self-center flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <FiEdit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Documents</span>
          </button>
        )}
      </div>

      {/* 2. Documents Viewer or Empty State */}
      {docs.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 md:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-2xs">
            <FiFileText className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-slate-900">
              No Supporting Documents Attached
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No identity or verification documents (Aadhaar, Driving License, Police Verification, Medical Certificate) have been uploaded for {driver.driver_name || "this driver"}.
            </p>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(driver)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              <span>Edit Driver to Upload Documents</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Document Select Tabs / Thumbnails */}
          {docs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {docs.map((doc, idx) => {
                const isSelected = selectedDocIndex === idx;
                const docType = getDocType(doc);
                const isImg = docType === "image";
                const isPdf = docType === "pdf";

                return (
                  <button
                    key={doc.id || idx}
                    type="button"
                    onClick={() => setSelectedDocIndex(idx)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isImg
                          ? "bg-purple-100 text-purple-700"
                          : isPdf
                          ? "bg-rose-100 text-rose-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isImg ? (
                        <FiImage className="w-3.5 h-3.5" />
                      ) : isPdf ? (
                        <FiFileText className="w-3.5 h-3.5" />
                      ) : (
                        <FiFile className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="max-w-[140px] truncate">
                      <p className="text-xs font-semibold truncate leading-tight">
                        {doc.name || `Document #${idx + 1}`}
                      </p>
                      {doc.size && (
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">
                          {formatFileSize(doc.size)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Document Header & Preview Pane */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {/* Active Document Topbar */}
            <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    activeDocType === "image"
                      ? "bg-purple-50 text-purple-600"
                      : activeDocType === "pdf"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {activeDocType === "image" ? (
                    <FiImage className="w-4 h-4" />
                  ) : activeDocType === "pdf" ? (
                    <FiFileText className="w-4 h-4" />
                  ) : (
                    <FiFile className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={activeDoc?.name}>
                    {activeDoc?.name || "Document Preview"}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <span className="uppercase font-semibold text-slate-600">
                      {activeDocType === "image"
                        ? "Image"
                        : activeDocType === "pdf"
                        ? "PDF Document"
                        : "File"}
                    </span>
                    {activeDoc?.size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(activeDoc.size)}</span>
                      </>
                    )}
                    {activeDoc?.uploadedAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(activeDoc.uploadedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: New Tab & Download */}
              <div className="flex items-center gap-2 shrink-0">
                {activeDoc?.dataUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenNewTab(activeDoc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      title="Open in new window"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(activeDoc)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document Live Preview Area */}
            <div className="p-3 sm:p-4 flex items-center justify-center min-h-[260px] max-h-[58vh] overflow-auto bg-slate-900/5">
              {activeDoc?.dataUrl ? (
                activeDocType === "image" ? (
                  <div className="relative flex items-center justify-center w-full">
                    <img
                      src={activeDoc.dataUrl}
                      alt={activeDoc.name || "Driver Document"}
                      className="max-h-[52vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                    />
                  </div>
                ) : activeDocType === "pdf" ? (
                  <div className="w-full h-[52vh] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                    <iframe
                      src={activeDoc.dataUrl}
                      title={activeDoc.name || "PDF Document"}
                      className="w-full h-full border-none"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FiFile className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {activeDoc.name || "Attached File"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Direct in-browser preview is not available for this format. Please click download to open.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(activeDoc)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <FiDownload className="w-4 h-4" />
                      <span>Download {activeDoc.name || "Document"}</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No preview source data available for this document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Footer Close Button */}
      <div className="flex items-center justify-end pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
