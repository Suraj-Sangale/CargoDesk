"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import CustomSearch from "../common/customSearch";
import {
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
} from "../common/floatingInput";
import VoiceDescription from "./voiceDescription";
import MediaUploader from "./mediaUploader";
import {
  FLEET_MAINTENANCE_TYPES,
  FLEET_MAINTENANCE_STATUSES,
} from "@/utilities/masterData";
import { showToast } from "@/utilities/toastService";
import { postApiData, uploadMediaFile } from "@/utilities/services/apiService";
import {
  FiTool,
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export default function MaintenanceForm({
  preselectedVehicle = null,
  initialData = null,
  isEdit = false,
  onClose,
  onSuccess,
}) {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    preselectedVehicle?.id ? String(preselectedVehicle.id) : initialData?.vehicle_id ? String(initialData.vehicle_id) : ""
  );

  const [descriptionValue, setDescriptionValue] = useState(initialData?.description || "");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      maintenance_type: initialData?.maintenance_type || FLEET_MAINTENANCE_TYPES[0],
      maintenance_date: initialData?.maintenance_date
        ? new Date(initialData.maintenance_date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      odometer_reading: initialData?.odometer_reading !== undefined && initialData?.odometer_reading !== null ? String(initialData.odometer_reading) : "",
      cost: initialData?.cost !== undefined && initialData?.cost !== null ? String(initialData.cost) : "",
      garage_name: initialData?.garage_name || "",
      invoice_number: initialData?.invoice_number || "",
      status: initialData?.status || "Reported",
      additional_notes: initialData?.additional_notes || "",
    },
  });

  // Fetch vehicles list for dropdown if not preselected
  useEffect(() => {
    let isMounted = true;
    async function loadVehicles() {
      setLoadingVehicles(true);
      try {
        const json = await postApiData("GET_VEHICLES_LIST");
        if (isMounted && json?.status && Array.isArray(json.data)) {
          setVehicles(json.data);
        }
      } catch (err) {
        console.error("Error loading vehicles list:", err);
      } finally {
        if (isMounted) setLoadingVehicles(false);
      }
    }

    loadVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format vehicles options for CustomSearch
  const vehicleOptions = useMemo(() => {
    if (preselectedVehicle) {
      return [
        {
          value: String(preselectedVehicle.id),
          label: `${preselectedVehicle.vehicle_number} - ${preselectedVehicle.vehicle_model || preselectedVehicle.vehicle_type || "Vehicle"}`,
        },
      ];
    }
    return vehicles.map((v) => ({
      value: String(v.id),
      label: `${v.vehicle_number} - ${v.vehicle_model || v.vehicle_type || "Vehicle"} (${v.status || "Active"})`,
    }));
  }, [vehicles, preselectedVehicle]);

  // Form submission handler
  const onSubmit = async (formData) => {
    const vid = selectedVehicleId ? Number(selectedVehicleId) : null;
    if (!vid) {
      showToast({ message: "Please select a vehicle", type: "error" });
      return;
    }

    if (!descriptionValue || descriptionValue.trim() === "") {
      showToast({ message: "Maintenance description is required", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress("Preparing submission...");

    try {
      const uploadedMediaItems = [];

      // Step 1: Upload attached files to S3 via presigned URLs
      if (attachedFiles.length > 0) {
        setSubmissionProgress(`Requesting upload authorizations for ${attachedFiles.length} file(s)...`);

        const presignPayload = {
          vehicleId: vid,
          files: attachedFiles.map((f) => ({
            fileName: f.fileName,
            mimeType: f.mimeType,
            fileSize: f.fileSize,
          })),
        };

        const presignJson = await postApiData("PRESIGN_MAINTENANCE_UPLOADS", presignPayload);
        if (!presignJson?.status || !Array.isArray(presignJson.data)) {
          throw new Error(presignJson?.message || "Failed to generate upload authorizations.");
        }

        const presignedMap = {};
        presignJson.data.forEach((item) => {
          presignedMap[item.fileName] = item;
        });

        // Step 2: Upload each file directly to S3
        for (let i = 0; i < attachedFiles.length; i++) {
          const item = attachedFiles[i];
          const presignedInfo = presignedMap[item.fileName];

          if (!presignedInfo || !presignedInfo.uploadUrl) {
            throw new Error(`Upload configuration missing for file: ${item.fileName}`);
          }

          setSubmissionProgress(`Uploading ${i + 1} of ${attachedFiles.length}: ${item.fileName}...`);

          // Update local status to uploading
          setAttachedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, uploadStatus: "uploading", progress: 20 } : f))
          );

          try {
            await uploadMediaFile({
              uploadUrl: presignedInfo.uploadUrl,
              file: item.file,
              mimeType: item.mimeType,
              s3Key: presignedInfo.s3Key,
            });

            setAttachedFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, uploadStatus: "completed", progress: 100 } : f))
            );

            uploadedMediaItems.push({
              s3_key: presignedInfo.s3Key,
              file_name: item.fileName,
              mime_type: item.mimeType,
              file_size: item.fileSize,
              media_type: item.mediaType,
            });
          } catch (uploadErr) {
            console.error(`Error uploading file ${item.fileName}:`, uploadErr);
            setAttachedFiles((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? { ...f, uploadStatus: "error", error: uploadErr.message || "Upload failed." }
                  : f
              )
            );
            throw new Error(`Failed to upload file "${item.fileName}". Please retry.`);
          }
        }
      }

      // Step 3: Save maintenance record in database
      setSubmissionProgress("Saving maintenance record in database...");

      const payload = {
        vehicle_id: vid,
        maintenance_type: formData.maintenance_type,
        description: descriptionValue.trim(),
        maintenance_date: formData.maintenance_date,
        odometer_reading: formData.odometer_reading || null,
        cost: formData.cost || "0.00",
        garage_name: formData.garage_name || null,
        invoice_number: formData.invoice_number || null,
        status: formData.status || "Reported",
        additional_notes: formData.additional_notes || null,
      };

      let saveJson;

      if (isEdit && initialData?.id) {
        payload.id = initialData.id;
        payload.newMedia = uploadedMediaItems;
        saveJson = await postApiData("UPDATE_MAINTENANCE_RECORD", payload);
      } else {
        payload.media = uploadedMediaItems;
        saveJson = await postApiData("ADD_NEW_MAINTENANCE", payload);
      }

      if (!saveJson?.status) {
        throw new Error(saveJson?.message || "Failed to save maintenance record.");
      }

      showToast({
        message: isEdit ? "Maintenance record updated successfully!" : "Maintenance record logged successfully!",
        type: "success",
      });

      if (onSuccess) {
        onSuccess(saveJson.data);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Submission error:", err);
      showToast({
        message: err.message || "Failed to complete maintenance submission.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
      {/* 1. Vehicle Selection Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <FiTruck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vehicle Identity
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Select the fleet vehicle undergoing maintenance
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Fleet Vehicle <span className="text-red-500">*</span>
          </label>
          <CustomSearch
            name="vehicle_id"
            value={selectedVehicleId}
            selectedValue={selectedVehicleId}
            options={vehicleOptions}
            disabled={isEdit || Boolean(preselectedVehicle)}
            placeholder={loadingVehicles ? "Loading vehicles..." : "Search by vehicle number or model..."}
            onChange={(opt) => {
              const val = opt?.value !== undefined ? opt.value : opt || "";
              setSelectedVehicleId(val ? String(val) : "");
            }}
          />
        </div>
      </div>

      {/* 2. Service Category & Date */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            <FiTool className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Maintenance Details
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Category, date, status, and voice-assisted description
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Maintenance Type */}
          <div>
            <Controller
              name="maintenance_type"
              control={control}
              rules={{ required: "Maintenance category is required" }}
              render={({ field }) => (
                <FloatingSelect
                  id="maintenance_type"
                  label="Maintenance Category"
                  required
                  options={FLEET_MAINTENANCE_TYPES}
                  value={field.value || ""}
                  selectedValue={field.value || ""}
                  onChange={(val) => {
                    const actualVal =
                      val && typeof val === "object"
                        ? val.value !== undefined
                          ? val.value
                          : val.target?.value
                        : val;
                    field.onChange(actualVal || "");
                  }}
                  onBlur={field.onBlur}
                  error={errors.maintenance_type}
                />
              )}
            />
          </div>

          {/* Maintenance Date */}
          <div>
            <FloatingInput
              id="maintenance_date"
              label="Maintenance Date"
              type="date"
              required
              error={errors.maintenance_date}
              {...register("maintenance_date", {
                required: "Maintenance date is required",
              })}
            />
          </div>
        </div>

        {/* Voice-Enabled Description */}
        <VoiceDescription
          value={descriptionValue}
          onChange={(val) => setDescriptionValue(val)}
          required
          disabled={isSubmitting}
        />

        {/* Operational Status */}
        <div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FloatingSelect
                id="maintenance_status"
                label="Maintenance Status"
                options={FLEET_MAINTENANCE_STATUSES}
                value={field.value || "Reported"}
                selectedValue={field.value || "Reported"}
                onChange={(val) => {
                  const actualVal =
                    val && typeof val === "object"
                      ? val.value !== undefined
                        ? val.value
                        : val.target?.value
                      : val;
                  field.onChange(actualVal || "Reported");
                }}
                onBlur={field.onBlur}
                error={errors.status}
              />
            )}
          />
        </div>
      </div>

      {/* 3. Metrics, Vendor & Billing */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <FiDollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Cost & Garage Vendor
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Expenses, odometer mileage, vendor, and reference invoice
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cost */}
          <div>
            <FloatingInput
              id="maintenance_cost"
              label="Maintenance Cost (₹)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 8500"
              error={errors.cost}
              {...register("cost", {
                min: { value: 0, message: "Cost cannot be negative" },
              })}
            />
          </div>

          {/* Odometer Reading */}
          <div>
            <FloatingInput
              id="maintenance_odometer"
              label="Odometer Reading (KM)"
              type="number"
              min="0"
              placeholder="e.g. 142500"
              error={errors.odometer_reading}
              {...register("odometer_reading", {
                min: { value: 0, message: "Odometer cannot be negative" },
              })}
            />
          </div>

          {/* Garage / Vendor Name */}
          <div>
            <FloatingInput
              id="garage_name"
              label="Garage / Vendor Name (Optional)"
              placeholder="e.g. Tata Authorized Service Center"
              error={errors.garage_name}
              {...register("garage_name")}
            />
          </div>

          {/* Invoice / Reference Number */}
          <div>
            <FloatingInput
              id="invoice_number"
              label="Invoice / Ref No. (Optional)"
              placeholder="e.g. INV-2025-0981"
              error={errors.invoice_number}
              {...register("invoice_number")}
            />
          </div>
        </div>

        {/* Additional Remarks */}
        <div>
          <FloatingTextarea
            id="additional_notes"
            label="Additional Notes / Remarks (Optional)"
            rows={2}
            placeholder="e.g. Recommended front brake pad check after next 5,000 km..."
            error={errors.additional_notes}
            {...register("additional_notes")}
          />
        </div>
      </div>

      {/* 4. Camera & Media Evidence (Direct S3 Integration) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <MediaUploader
          files={attachedFiles}
          setFiles={setAttachedFiles}
          disabled={isSubmitting}
          vehicleId={selectedVehicleId}
        />
      </div>

      {/* Submission Status Banner */}
      {isSubmitting && submissionProgress && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs animate-pulse">
          <ImSpinner9 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span>{submissionProgress}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 sticky bottom-0 bg-white py-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <ImSpinner9 className="w-4 h-4 animate-spin" />
              <span>Saving Record...</span>
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{isEdit ? "Update Maintenance Record" : "Save Maintenance Record"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Export MaintenanceFormV2 alongside existing MaintenanceForm for backward compatibility & convenience
export { default as MaintenanceFormV2 } from "./maintenanceFormV2";

