"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiCamera,
  FiVideo,
  FiUploadCloud,
  FiX,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiImage,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const MAX_ATTACHMENTS = 10;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export default function MediaUploader({
  files = [],
  setFiles,
  disabled = false,
  vehicleId = null,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (_) {}
        }
      });
    };
  }, []);

  const handleFilesSelected = useCallback(
    (incomingFileList) => {
      if (!incomingFileList || incomingFileList.length === 0) return;
      setErrorMessage(null);

      const incomingArr = Array.from(incomingFileList);

      if (files.length + incomingArr.length > MAX_ATTACHMENTS) {
        setErrorMessage(
          `You can attach a maximum of ${MAX_ATTACHMENTS} files in total. Only the first permitted files will be added.`
        );
      }

      const validNewFiles = [];
      const remainingSlots = MAX_ATTACHMENTS - files.length;

      for (let i = 0; i < Math.min(incomingArr.length, remainingSlots); i++) {
        const file = incomingArr[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setErrorMessage(`Skipped "${file.name}": Unsupported format. Only images and videos are supported.`);
          continue;
        }

        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
          setErrorMessage(
            `"${file.name}" exceeds the 10 MB image size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
          );
          continue;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
          setErrorMessage(
            `"${file.name}" exceeds the 100 MB video size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
          );
          continue;
        }

        // Avoid duplicate files by name and size
        const isDuplicate = files.some(
          (existing) => existing.file?.name === file.name && existing.file?.size === file.size
        );
        if (isDuplicate) continue;

        const previewUrl = URL.createObjectURL(file);
        validNewFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaType: isImage ? "image" : "video",
          previewUrl,
          uploadStatus: "pending", // 'pending' | 'uploading' | 'completed' | 'error'
          progress: 0,
          s3Key: null,
          error: null,
        });
      }

      if (validNewFiles.length > 0) {
        setFiles((prev) => [...prev, ...validNewFiles]);
      }
    },
    [files, setFiles]
  );

  const handleRemoveFile = (fileId) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === fileId);
      if (target?.previewUrl && target.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch (_) {}
      }
      return prev.filter((item) => item.id !== fileId);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Photos & Videos Evidence ({files.length}/{MAX_ATTACHMENTS})
          </label>
          <p className="text-[11px] text-slate-500 font-medium">
            Upload images (up to 10 MB) and videos (up to 100 MB) of maintenance and parts.
          </p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_ATTACHMENTS}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <FiUploadCloud className="w-4 h-4 text-blue-600" />
          <span>Select Files</span>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_ATTACHMENTS}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <FiCamera className="w-4 h-4 text-blue-600" />
          <span>Camera Photo</span>
        </button>

        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_ATTACHMENTS}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <FiVideo className="w-4 h-4 text-purple-600" />
          <span>Record Video</span>
        </button>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Previews Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {files.map((item) => {
            const isImg = item.mediaType === "image";
            const sizeStr = (item.fileSize / (1024 * 1024)).toFixed(1);

            return (
              <div
                key={item.id}
                className="relative group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs flex flex-col"
              >
                {/* Media Preview Box */}
                <div className="relative w-full h-24 bg-slate-900 flex items-center justify-center overflow-hidden">
                  {isImg ? (
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )}

                  {/* Type badge */}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white flex items-center gap-1 backdrop-blur-xs">
                    {isImg ? <FiImage className="w-2.5 h-2.5" /> : <FiVideo className="w-2.5 h-2.5" />}
                    <span>{isImg ? "IMAGE" : "VIDEO"}</span>
                  </span>

                  {/* Remove button */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                      title="Remove media"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Upload status indicator overlay */}
                  {item.uploadStatus === "uploading" && (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white gap-1 backdrop-blur-2xs">
                      <ImSpinner9 className="w-5 h-5 animate-spin" />
                      <span className="text-[10px] font-bold">{item.progress}%</span>
                    </div>
                  )}

                  {item.uploadStatus === "completed" && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <FiCheck className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* File info footer */}
                <div className="p-2 bg-slate-50 border-t border-slate-100 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] font-semibold text-slate-800 truncate" title={item.fileName}>
                    {item.fileName}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{sizeStr} MB</span>
                    <span
                      className={`font-semibold capitalize ${
                        item.uploadStatus === "completed"
                          ? "text-emerald-600"
                          : item.uploadStatus === "error"
                          ? "text-rose-600"
                          : "text-slate-500"
                      }`}
                    >
                      {item.uploadStatus === "completed" ? "Ready" : item.uploadStatus}
                    </span>
                  </div>

                  {item.error && (
                    <p className="text-[10px] text-rose-600 mt-1 truncate" title={item.error}>
                      {item.error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
