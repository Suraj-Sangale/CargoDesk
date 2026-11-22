import React, { useEffect, useRef, useState } from "react";
import { FiUploadCloud, FiCheck, FiImage, FiX } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import {
  postApiData,
  uploadMediaFile,
  resolveMediaUrl,
} from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // keep in sync with MAX_IMAGE_SIZE_BYTES
const DEFAULT_HERO = "/imges/png/fleet_truck_hero.jpg";

/**
 * Lets the user pick a new vehicle photo, uploads it to S3 via the
 * fleet presign endpoint (with proxy fallback), then saves the resulting
 * URL into fleets.vehicle_photo.
 */
export default function ChangeFleetPhotoForm({ fleet, currentPhoto, onClose, onSuccess }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = (selected) => {
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      showToast({ message: "Please select a JPG, PNG or WEBP image.", type: "error" });
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      showToast({ message: "Image must be smaller than 10 MB.", type: "error" });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!file || !fleet?.id) return;
    setSaving(true);
    try {
      // 1. Get presigned S3 upload URL
      const presignRes = await postApiData("PRESIGN_FLEET_UPLOADS", {
        fleetId: fleet.id,
        files: [
          {
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            category: "photo",
          },
        ],
      });

      const presigned = presignRes?.data?.[0];
      if (!presignRes?.status || !presigned) {
        throw new Error(presignRes?.message || "Failed to initialize photo upload.");
      }

      // 2. Upload binary to S3 (direct PUT, falls back to server proxy)
      await uploadMediaFile({
        uploadUrl: presigned.uploadUrl,
        file,
        mimeType: file.type,
        s3Key: presigned.s3Key,
      });

      // 3. Persist the new photo on the fleet record
      const updateRes = await postApiData("UPDATE_FLEET", {
        id: fleet.id,
        vehicle_photo: presigned.fileUrl || presigned.s3Key,
      });

      if (!updateRes?.status) {
        throw new Error(updateRes?.message || updateRes?.error || "Failed to save vehicle photo.");
      }

      showToast({ message: "Vehicle photo updated", type: "success" });
      onSuccess?.(presigned.fileUrl || presigned.s3Key);
      onClose?.();
    } catch (err) {
      console.error("Error updating fleet photo:", err);
      showToast({ message: err?.message || "Failed to update photo", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const shownImage = previewUrl || (currentPhoto ? resolveMediaUrl(currentPhoto) : DEFAULT_HERO);

  return (
    <div className="p-5 space-y-4">
      {/* Preview */}
      <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shownImage}
          alt={fleet?.vehicle_number || "Vehicle photo"}
          className="w-full h-full object-cover"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(DEFAULT_HERO)) e.currentTarget.src = DEFAULT_HERO;
          }}
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/70 text-white">
          {previewUrl ? "New photo" : "Current photo"}
        </span>
        {previewUrl && !saving && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white cursor-pointer"
            title="Remove selection"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !saving && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !saving) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!saving) pickFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
          dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        {file ? (
          <FiImage className="w-6 h-6 text-blue-600" />
        ) : (
          <FiUploadCloud className="w-6 h-6 text-slate-400" />
        )}
        <p className="text-sm font-semibold text-slate-700">
          {file ? file.name : "Click to choose or drag & drop a photo"}
        </p>
        <p className="text-xs text-slate-400">JPG, PNG or WEBP · up to 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !file}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {saving ? (
            <>
              <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FiCheck className="w-3.5 h-3.5" />
              <span>Save Photo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
