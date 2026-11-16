"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import moment from "moment";
import CustomSearch from "../common/customSearch";
import {
  FloatingInput,
  FloatingSelect,
  FloatingDatePicker,
  FloatingTextarea,
} from "../common/floatingInput";
import { useFleetDriver } from "@/context/fleetDriverContext";
import {
  postApiData,
  uploadMediaFile,
  compressImageFile,
  resolveMediaUrl,
} from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import useAutoFocusField from "@/hooks/useAutoFocusField";
import {
  DRIVER_LICENSE_TYPES,
  DRIVER_STATUS_OPTIONS,
  DRIVER_BLOOD_GROUPS,
} from "@/utilities/masterData";
import {
  FiUser,
  FiFileText,
  FiTruck,
  FiCheck,
  FiShield,
  FiCamera,
  FiUploadCloud,
  FiTrash2,
  FiEye,
  FiFile,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const DEFAULT_DRIVER_VALUES = {
  driver_name: "",
  contact_number: "",
  alt_contact_number: "",
  license_number: "",
  license_type: DRIVER_LICENSE_TYPES[0] || "Heavy Transport Vehicle (HTV)",
  license_expiry: "",
  experience_years: "5 Years",
  blood_group: "B+",
  emergency_contact: "",
  status: "Active",
  address: "",
  notes: "",
};

export default function DriverForm({
  setDriverList,
  modalData,
  isEdit,
  focusField,
  onClose,
  toggleModal,
}) {
  const { fleets, refreshAll } = useFleetDriver();

  const [profilePhoto, setProfilePhoto] = useState("");
  const [newProfileFile, setNewProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedFleetId, setSelectedFleetId] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const profileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: DEFAULT_DRIVER_VALUES,
  });

  // Populate data when editing
  useEffect(() => {
    if (isEdit && modalData) {
      const licType =
        modalData.license_type ||
        modalData.licenseType ||
        modalData.license_category ||
        modalData.licenseCategory ||
        DRIVER_LICENSE_TYPES[0];
      const bloodGrp = modalData.blood_group || modalData.bloodGroup || "B+";
      const driverStatus = modalData.status || "Active";

      reset({
        driver_name: modalData.driver_name || modalData.name || "",
        contact_number: modalData.contact_number || modalData.contactNo || "",
        alt_contact_number: modalData.alt_contact_number || "",
        license_number: modalData.license_number || "",
        license_type: licType,
        license_expiry: modalData.license_expiry
          ? moment(modalData.license_expiry).format("YYYY-MM-DD")
          : "",
        experience_years: modalData.experience_years || "5 Years",
        blood_group: bloodGrp,
        emergency_contact: modalData.emergency_contact || "",
        status: driverStatus,
        address: modalData.address || "",
        notes: modalData.notes || modalData.note || "",
      });

      setValue("license_type", licType);
      setValue("blood_group", bloodGrp);
      setValue("status", driverStatus);

      // Find initial fleet id
      let initialFleetId = "";
      if (modalData.fleet_id) {
        initialFleetId = modalData.fleet_id;
      } else if (modalData.assigned_vehicle) {
        const found = fleets.find(
          (f) =>
            f.vehicle_number?.toUpperCase() ===
            modalData.assigned_vehicle?.toUpperCase()
        );
        if (found) initialFleetId = found.id;
      } else {
        const found = fleets.find(
          (f) => Number(f.driver_id) === Number(modalData.id)
        );
        if (found) initialFleetId = found.id;
      }
      setSelectedFleetId(initialFleetId ? String(initialFleetId) : "");

      const rawPhoto = modalData.profile_photo || "";
      const resolvedPhoto = resolveMediaUrl(rawPhoto);
      setProfilePhoto(resolvedPhoto);
      setProfilePreviewUrl(resolvedPhoto);
      setNewProfileFile(null);

      // Parse supporting docs if JSON string or array
      if (modalData.supporting_documents) {
        if (Array.isArray(modalData.supporting_documents)) {
          setSupportingDocs(
            modalData.supporting_documents.map((d) => ({
              ...d,
              dataUrl: resolveMediaUrl(d.dataUrl || d.url || ""),
              url: resolveMediaUrl(d.url || d.dataUrl || ""),
              isNew: false,
            }))
          );
        } else {
          try {
            const parsed = JSON.parse(modalData.supporting_documents);
            setSupportingDocs(
              Array.isArray(parsed)
                ? parsed.map((d) => ({
                    ...d,
                    dataUrl: resolveMediaUrl(d.dataUrl || d.url || ""),
                    url: resolveMediaUrl(d.url || d.dataUrl || ""),
                    isNew: false,
                  }))
                : []
            );
          } catch (_) {
            setSupportingDocs([]);
          }
        }
      } else {
        setSupportingDocs([]);
      }
    } else {
      reset(DEFAULT_DRIVER_VALUES);
      setSelectedFleetId("");
      setProfilePhoto("");
      setProfilePreviewUrl("");
      setNewProfileFile(null);
      setSupportingDocs([]);
    }
  }, [isEdit, modalData, reset, fleets]);

  // Reusable platform-wide auto-scroll and highlight target field
  useAutoFocusField(focusField, Boolean(focusField), [modalData, isEdit]);

  // Construct options for CustomSearch dropdown
  const fleetOptions = useMemo(() => {
    const opts = [
      {
        value: "",
        label: "-- Unassigned (No Fleet Vehicle) --",
      },
    ];

    fleets.forEach((f) => {
      const isCurrentDriver =
        modalData?.id && Number(f.driver_id) === Number(modalData.id);
      const isAssignedElsewhere = f.driver_id && !isCurrentDriver;

      opts.push({
        value: String(f.id),
        id: f.id,
        label: `${f.vehicle_number} (${f.vehicle_type || f.vehicle_model || "Fleet"})${
          isCurrentDriver
            ? " [Currently Assigned]"
            : isAssignedElsewhere
            ? ` [Assigned: ${f.driver_name || "Driver"}]`
            : " [Available]"
        }`,
        fleet: f,
      });
    });

    return opts;
  }, [fleets, modalData]);

  // Find currently selected fleet object for preview
  const selectedFleet = useMemo(() => {
    if (!selectedFleetId) return null;
    return fleets.find((f) => String(f.id) === String(selectedFleetId)) || null;
  }, [selectedFleetId, fleets]);

  // Check if selected fleet is currently assigned to another driver
  const isFleetReassigned = useMemo(() => {
    if (!selectedFleet || !selectedFleet.driver_id) return false;
    if (!modalData?.id) return true;
    return Number(selectedFleet.driver_id) !== Number(modalData.id);
  }, [selectedFleet, modalData]);

  const handleClose = () => {
    if (onClose) onClose();
    if (toggleModal) toggleModal();
  };

  // Helper to format file size in KB / MB
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Handle Profile Photo selection with client-side preview & optimization
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, JPEG, WEBP)", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Profile photo exceeds 10 MB limit", "error");
      return;
    }

    let optimizedFile = file;
    try {
      optimizedFile = await compressImageFile(file, { maxDimension: 600, quality: 0.85 });
    } catch (_) {}

    if (profilePreviewUrl && profilePreviewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(profilePreviewUrl);
      } catch (_) {}
    }

    const preview = URL.createObjectURL(optimizedFile);
    setNewProfileFile(optimizedFile);
    setProfilePreviewUrl(preview);
    showToast("Profile photo selected (will be uploaded to S3)", "success");
  };

  const handleRemoveProfilePhoto = () => {
    if (profilePreviewUrl && profilePreviewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(profilePreviewUrl);
      } catch (_) {}
    }
    setProfilePhoto("");
    setProfilePreviewUrl("");
    setNewProfileFile(null);
    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }
    showToast("Profile photo removed", "info");
  };

  // Handle Supporting Documents batch selection
  const handleSupportingDocsUpload = (files) => {
    if (!files || files.length === 0) return;

    const maxFileSize = 15 * 1024 * 1024;
    const maxTotalDocs = 15;

    if (supportingDocs.length + files.length > maxTotalDocs) {
      showToast(`You can attach up to ${maxTotalDocs} documents.`, "error");
      return;
    }

    const newDocItems = [];

    Array.from(files).forEach((file) => {
      const isImg = file.type?.startsWith("image/");
      const isPdf =
        file.type === "application/pdf" ||
        file.name?.toLowerCase().endsWith(".pdf");

      if (!isImg && !isPdf) {
        showToast(
          `Unsupported file format: ${file.name}. Only images and PDFs are allowed.`,
          "error"
        );
        return;
      }

      if (file.size > maxFileSize) {
        showToast(
          `File "${file.name}" exceeds 15 MB limit (${formatFileSize(file.size)})`,
          "error"
        );
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newDocItems.push({
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
        file,
        previewUrl,
        isNew: true,
      });
    });

    if (newDocItems.length > 0) {
      setSupportingDocs((prev) => [...prev, ...newDocItems]);
      showToast(
        `${newDocItems.length} document(s) added (ready for S3 upload)`,
        "success"
      );
    }
  };

  const handleRemoveDoc = (docId) => {
    setSupportingDocs((prev) => {
      const target = prev.find((d) => d.id === docId);
      if (target?.previewUrl && target.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch (_) {}
      }
      return prev.filter((d) => d.id !== docId);
    });
    showToast("Document removed", "info");
  };

  const onSubmit = async (data) => {
    setApiLoading(true);
    setUploadProgress("Preparing upload...");

    try {
      const driverId = modalData?.id || null;
      let finalProfilePhoto = profilePhoto || null;

      // 1. Upload new profile photo if selected
      if (newProfileFile) {
        setUploadProgress("Authorizing profile photo upload...");
        const presignRes = await postApiData("PRESIGN_DRIVER_UPLOADS", {
          driverId,
          files: [
            {
              fileName: newProfileFile.name,
              mimeType: newProfileFile.type || "image/jpeg",
              fileSize: newProfileFile.size,
              category: "profile",
            },
          ],
        });

        if (!presignRes?.status || !Array.isArray(presignRes.data) || !presignRes.data[0]) {
          throw new Error(presignRes?.message || "Failed to initialize profile photo upload.");
        }

        const presignedPhoto = presignRes.data[0];
        setUploadProgress("Uploading profile photo to cloud storage...");

        await uploadMediaFile({
          uploadUrl: presignedPhoto.uploadUrl,
          file: newProfileFile,
          mimeType: newProfileFile.type || "image/jpeg",
          s3Key: presignedPhoto.s3Key,
        });

        finalProfilePhoto = presignedPhoto.fileUrl;
      }

      // 2. Upload new supporting documents if any
      const newDocsToUpload = supportingDocs.filter((d) => d.isNew && d.file);
      const existingDocs = supportingDocs.filter((d) => !d.isNew);
      const uploadedDocs = [];

      if (newDocsToUpload.length > 0) {
        setUploadProgress(`Authorizing ${newDocsToUpload.length} document(s)...`);

        const presignDocsRes = await postApiData("PRESIGN_DRIVER_UPLOADS", {
          driverId,
          files: newDocsToUpload.map((d) => ({
            fileName: d.name,
            mimeType: d.type,
            fileSize: d.size,
            category: "documents",
          })),
        });

        if (!presignDocsRes?.status || !Array.isArray(presignDocsRes.data)) {
          throw new Error(presignDocsRes?.message || "Failed to initialize document uploads.");
        }

        const presignedDocMap = {};
        presignDocsRes.data.forEach((p) => {
          presignedDocMap[p.fileName] = p;
        });

        for (let i = 0; i < newDocsToUpload.length; i++) {
          const doc = newDocsToUpload[i];
          const presignedInfo = presignedDocMap[doc.name] || presignDocsRes.data[i];

          if (!presignedInfo || !presignedInfo.uploadUrl) {
            throw new Error(`Upload authorization missing for: ${doc.name}`);
          }

          setUploadProgress(`Uploading ${doc.name} (${i + 1} of ${newDocsToUpload.length}) to S3...`);

          await uploadMediaFile({
            uploadUrl: presignedInfo.uploadUrl,
            file: doc.file,
            mimeType: doc.type,
            s3Key: presignedInfo.s3Key,
          });

          uploadedDocs.push({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            type: doc.type,
            dataUrl: presignedInfo.fileUrl,
            url: presignedInfo.fileUrl,
            s3Key: presignedInfo.s3Key,
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      // Combined clean documents list (only S3 URLs and safe legacy URLs, no large file Blobs)
      const finalSupportingDocs = [
        ...existingDocs.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
          type: d.type,
          dataUrl: d.dataUrl || d.url || null,
          url: d.url || d.dataUrl || null,
          s3Key: d.s3Key || null,
          uploadedAt: d.uploadedAt || new Date().toISOString(),
        })),
        ...uploadedDocs,
      ];

      setUploadProgress("Saving driver details...");

      const parsedFleetId =
        selectedFleetId !== "" && Number(selectedFleetId) > 0
          ? Number(selectedFleetId)
          : null;

      const formattedLicenseExpiry = data.license_expiry
        ? moment(data.license_expiry).format("YYYY-MM-DD")
        : null;

      const payload = {
        driver_name: data.driver_name ? data.driver_name.trim() : "",
        contact_number: data.contact_number ? data.contact_number.trim() : "",
        alt_contact_number: data.alt_contact_number
          ? data.alt_contact_number.trim()
          : "",
        license_number: data.license_number
          ? data.license_number.toUpperCase().trim()
          : "",
        license_type: data.license_type || "",
        license_expiry: formattedLicenseExpiry,
        experience_years: data.experience_years
          ? data.experience_years.trim()
          : "",
        blood_group: data.blood_group || "B+",
        emergency_contact: data.emergency_contact
          ? data.emergency_contact.trim()
          : "",
        status: data.status || "Active",
        address: data.address ? data.address.trim() : "",
        notes: data.notes ? data.notes.trim() : "",
        profile_photo: finalProfilePhoto,
        supporting_documents:
          finalSupportingDocs.length > 0 ? JSON.stringify(finalSupportingDocs) : null,
        fleet_id: parsedFleetId,
      };

      let response;
      if (isEdit) {
        payload.id = modalData.id;
        response = await postApiData("UPDATE_DRIVER", payload);
      } else {
        response = await postApiData("ADD_NEW_DRIVER", payload);
      }

      if (response && response.status) {
        showToast(
          response.message ||
            (isEdit
              ? "Driver updated successfully"
              : "Driver added successfully"),
          "success"
        );

        // Refresh synchronized context datasets
        await refreshAll();

        if (setDriverList) {
          if (isEdit) {
            setDriverList((prev) =>
              prev.map((item) =>
                item.id == modalData.id
                  ? {
                      ...item,
                      ...payload,
                      id: modalData.id,
                      fleet_id: parsedFleetId,
                      assigned_vehicle: selectedFleet?.vehicle_number || null,
                      vehicle_number: selectedFleet?.vehicle_number || null,
                      vehicle_model: selectedFleet?.vehicle_model || null,
                    }
                  : item
              )
            );
          } else {
            setDriverList((prev) => [
              {
                ...payload,
                id: response.id || Date.now(),
                fleet_id: parsedFleetId,
                assigned_vehicle: selectedFleet?.vehicle_number || null,
                vehicle_number: selectedFleet?.vehicle_number || null,
                vehicle_model: selectedFleet?.vehicle_model || null,
              },
              ...prev,
            ]);
          }
        }

        handleClose();
      } else {
        showToast(response?.message || "Failed to save driver record", "error");
      }
    } catch (err) {
      console.error("Error saving driver with S3 documents:", err);
      showToast(err.message || "Failed to upload files or save driver.", "error");
    } finally {
      setApiLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-4 sm:px-6 py-4 space-y-4 bg-slate-50"
      >
        {/* 1. Profile Photo Header Banner */}
        <div
          data-field-container
          data-field="profile_photo"
          id="profile_photo"
          className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-2xs transition-all"
        >
          {/* Avatar / Photo preview */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md flex items-center justify-center text-slate-400 relative">
              {profilePreviewUrl || profilePhoto ? (
                <>
                  <img
                    src={profilePreviewUrl || profilePhoto}
                    alt="Driver Profile"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fb = e.currentTarget.nextElementSibling;
                      if (fb) fb.style.display = "flex";
                    }}
                    className="w-full h-full object-cover"
                    
                  />
                  <div
                    style={{ display: "none" }}
                    className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 items-center justify-center text-white text-2xl font-bold"
                  >
                    <FiUser className="w-8 h-8" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  <FiUser className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Quick Camera Overlay Button */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => profileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110 cursor-pointer"
              title="Upload profile photo"
            >
              <FiCamera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Photo Actions & Guidance */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Driver Profile Photograph
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Optional
              </span>
              {newProfileFile ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Ready for S3 Upload
                </span>
              ) : profilePhoto ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  S3 Cloud Stored
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Upload a clear frontal photo for identity badges and dispatch verification (stored securely in S3 storage).
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => profileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              >
                {profilePreviewUrl || profilePhoto ? "Change Photo" : "Upload Photo"}
              </button>
              {(profilePreviewUrl || profilePhoto) && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={handleRemoveProfilePhoto}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Personal & Contact Information */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-2xs">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Personal & Contact Information
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Driver full name, primary contact and blood group
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Full Name */}
            <div data-field-container data-field="driver_name">
              <FloatingInput
                id="driver_name"
                label="Driver Full Name"
                required
                placeholder="e.g. Ramesh Sharma"
                error={errors.driver_name}
                {...register("driver_name", {
                  required: "Driver name is required",
                })}
              />
            </div>

            {/* Primary Mobile Contact */}
            <div data-field-container data-field="contact_number">
              <FloatingInput
                id="contact_number"
                label="Primary Mobile Number"
                required
                type="tel"
                placeholder="e.g. +91 98201 44552"
                error={errors.contact_number}
                {...register("contact_number", {
                  required: "Primary mobile number is required",
                })}
              />
            </div>

            {/* Alternate Mobile Contact */}
            <div data-field-container data-field="alt_contact_number">
              <FloatingInput
                id="alt_contact_number"
                label="Alternate Contact (Optional)"
                type="tel"
                placeholder="e.g. +91 98201 44550"
                error={errors.alt_contact_number}
                {...register("alt_contact_number")}
              />
            </div>

            {/* Blood Group */}
            <div data-field-container data-field="blood_group">
              <Controller
                name="blood_group"
                control={control}
                render={({ field }) => (
                  <FloatingSelect
                    id="driver_blood_group"
                    name="blood_group"
                    label="Blood Group"
                    options={DRIVER_BLOOD_GROUPS}
                    value={field.value || "B+"}
                    selectedValue={field.value || "B+"}
                    onChange={(val) => {
                      const actualVal =
                        val && typeof val === "object"
                          ? val.value !== undefined
                            ? val.value
                            : val.target?.value
                          : val;
                      field.onChange(actualVal || "B+");
                    }}
                    onBlur={field.onBlur}
                    error={errors.blood_group}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* 3. License & Certification */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shadow-2xs">
              <FiShield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                License & Qualifications
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Driving license number, authorized category and validity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* License Number */}
            <div data-field-container data-field="license_number">
              <FloatingInput
                id="driver_license_number"
                label="Driving License No."
                required
                placeholder="e.g. MH04 20150012345"
                className="uppercase font-mono font-semibold"
                error={errors.license_number}
                {...register("license_number", {
                  required: "Driving License number is required",
                  onChange: (e) =>
                    setValue("license_number", e.target.value.toUpperCase()),
                })}
              />
            </div>

            {/* License Type */}
            <div data-field-container data-field="license_type">
              <Controller
                name="license_type"
                control={control}
                rules={{ required: "License Category is required" }}
                render={({ field }) => (
                  <FloatingSelect
                    id="driver_license_type"
                    name="license_type"
                    label="License Category"
                    required
                    options={DRIVER_LICENSE_TYPES}
                    value={field.value || DRIVER_LICENSE_TYPES[0]}
                    selectedValue={field.value || DRIVER_LICENSE_TYPES[0]}
                    onChange={(val) => {
                      const actualVal =
                        val && typeof val === "object"
                          ? val.value !== undefined
                            ? val.value
                            : val.target?.value
                          : val;
                      field.onChange(actualVal || DRIVER_LICENSE_TYPES[0]);
                    }}
                    onBlur={field.onBlur}
                    error={errors.license_type}
                  />
                )}
              />
            </div>

            {/* License Expiry Date */}
            <div data-field-container data-field="license_expiry">
              <Controller
                name="license_expiry"
                control={control}
                render={({ field }) => (
                  <FloatingDatePicker
                    id="driver_license_expiry"
                    name="license_expiry"
                    label="License Expiry Date"
                    format="DD/MM/YYYY"
                    error={errors.license_expiry}
                    value={field.value}
                    onChange={(val) => {
                      const formatted =
                        val && moment(val).isValid()
                          ? moment(val).format("YYYY-MM-DD")
                          : val;
                      field.onChange(formatted || "");
                    }}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            {/* Driving Experience */}
            <div data-field-container data-field="experience_years">
              <FloatingInput
                id="driver_experience_years"
                label="Total Driving Experience"
                placeholder="e.g. 8 Years / 12 Years"
                error={errors.experience_years}
                {...register("experience_years")}
              />
            </div>
          </div>
        </div>

        {/* 4. Supporting Documents Upload Section */}
        <div
          data-field-container
          data-field="supporting_documents"
          id="supporting_documents"
          className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shadow-2xs">
                <FiFileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supporting Documents
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Aadhaar, Driving License scan, Police Verification, Medical Certificate
                </p>
              </div>
            </div>
            {supportingDocs.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {supportingDocs.length} {supportingDocs.length === 1 ? "File" : "Files"}
              </span>
            )}
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSupportingDocsUpload(e.dataTransfer.files);
            }}
            onClick={() => docInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50/60"
                : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input
              ref={docInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => handleSupportingDocsUpload(e.target.files)}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <FiUploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Click to browse or drag & drop documents here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports PDF, PNG, JPG, JPEG, DOC (Max 15MB per file)
            </p>
          </div>

          {/* Uploaded Documents List */}
          {supportingDocs.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Attached Documents ({supportingDocs.length}):</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  S3 Cloud Storage Enabled
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {supportingDocs.map((doc) => {
                  const docUrl = resolveMediaUrl(doc.previewUrl || doc.dataUrl || doc.url);
                  const isImage =
                    doc.type?.startsWith("image/") ||
                    docUrl?.startsWith("data:image/") ||
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name || "");
                  const isPdf =
                    doc.type === "application/pdf" ||
                    doc.name?.toLowerCase().endsWith(".pdf") ||
                    docUrl?.startsWith("data:application/pdf");

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImage && docUrl ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <img
                              src={docUrl}
                              alt={doc.name}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.nextElementSibling;
                                if (fb) fb.style.display = "flex";
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div
                              style={{ display: "none" }}
                              className="w-full h-full bg-purple-50 text-purple-600 font-bold text-xs items-center justify-center"
                            >
                              <FiFile className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                              isPdf
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            <FiFile className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold text-slate-800 truncate"
                            title={doc.name}
                          >
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatFileSize(doc.size)}
                            </span>
                            {doc.isNew ? (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                Ready for S3
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Cloud Stored
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* View & Remove actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {docUrl && (
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Document"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. Vehicle Assignment & Operations */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-2xs">
              <FiTruck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Vehicle Assignment & Operational Details
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Assign fleet vehicle, emergency contact and operational status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned Vehicle Custom Search */}
            <div
              data-field-container
              data-field="assigned_vehicle"
              id="assigned_vehicle"
              className="md:col-span-2 space-y-2 transition-all p-1"
            >
              <label className="block text-xs font-bold text-slate-700">
                Assigned Fleet Vehicle{" "}
                <span className="text-slate-400 font-normal">
                  (Single source of truth via MySQL ID)
                </span>
              </label>

              <CustomSearch
                name="fleet_id"
                label="Select Assigned Fleet Vehicle"
                options={fleetOptions}
                value={selectedFleetId}
                selectedValue={selectedFleetId}
                onChange={(result) => {
                  const val = result ? String(result.value || "") : "";
                  setSelectedFleetId(val);
                }}
                className="w-full"
              />

              {/* Reassignment Warning */}
              {isFleetReassigned && selectedFleet && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Vehicle Reassignment Notice:</span>{" "}
                    This vehicle (
                    <span className="font-semibold">{selectedFleet.vehicle_number}</span>
                    ) is currently assigned to{" "}
                    <span className="font-bold text-amber-900">
                      {selectedFleet.driver_name || "another driver"}
                    </span>
                    . Saving this form will automatically transfer the vehicle assignment to this driver.
                  </div>
                </div>
              )}

              {/* Selected Fleet Vehicle Details Card */}
              {selectedFleet && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <FiTruck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {selectedFleet.vehicle_number}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{selectedFleet.vehicle_type || "Vehicle"}</span>
                        {selectedFleet.vehicle_model && (
                          <>
                            <span>•</span>
                            <span>{selectedFleet.vehicle_model}</span>
                          </>
                        )}
                        {selectedFleet.capacity && (
                          <>
                            <span>•</span>
                            <span>Cap: {selectedFleet.capacity}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSelectedFleetId("")}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Unassign Vehicle
                  </button>
                </div>
              )}
            </div>

            {/* Operational Status */}
            <div data-field-container data-field="status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FloatingSelect
                    id="driver_status"
                    name="status"
                    label="Operational Status"
                    options={DRIVER_STATUS_OPTIONS}
                    value={field.value || "Active"}
                    selectedValue={field.value || "Active"}
                    onChange={(val) => {
                      const actualVal =
                        val && typeof val === "object"
                          ? val.value !== undefined
                            ? val.value
                            : val.target?.value
                          : val;
                      field.onChange(actualVal || "Active");
                    }}
                    onBlur={field.onBlur}
                    error={errors.status}
                  />
                )}
              />
            </div>

            {/* Emergency Contact */}
            <div data-field-container data-field="emergency_contact" className="md:col-span-1">
              <FloatingInput
                id="driver_emergency_contact"
                label="Emergency Contact & Relation"
                placeholder="e.g. Sunita Sharma (Wife) - +91 98201 11223"
                error={errors.emergency_contact}
                {...register("emergency_contact")}
              />
            </div>

            {/* Residential Address */}
            <div data-field-container data-field="address" className="md:col-span-2">
              <FloatingInput
                id="driver_address"
                label="Residential Address"
                placeholder="e.g. Flat 302, Sai Krupa Heights, Thane West, Maharashtra - 400601"
                error={errors.address}
                {...register("address")}
              />
            </div>

            {/* Notes */}
            <div data-field-container data-field="notes" className="md:col-span-2">
              <FloatingTextarea
                id="driver_notes"
                label="Notes & Special Instructions"
                rows={2}
                placeholder="e.g. Certified for handling hazardous freight and multi-axle trailers..."
                error={errors.notes}
                {...register("notes")}
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={apiLoading}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={apiLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {apiLoading ? (
              <>
                <ImSpinner9 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || (isEdit ? "Updating Driver..." : "Saving Driver...")}</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>{isEdit ? "Update Driver Record" : "Save Driver Record"}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Document Quick Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 truncate pr-4">
                {previewDoc.name}
              </h4>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              {(() => {
                const targetUrl = resolveMediaUrl(previewDoc.previewUrl || previewDoc.dataUrl || previewDoc.url);
                const isImage =
                  previewDoc.type?.startsWith("image/") ||
                  targetUrl?.startsWith("data:image/") ||
                  /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.name || "") ||
                  /\.(jpg|jpeg|png|webp|gif)$/i.test((targetUrl || "").split("?")[0]);
                const isPdf =
                  previewDoc.type === "application/pdf" ||
                  previewDoc.name?.toLowerCase().endsWith(".pdf") ||
                  targetUrl?.startsWith("data:application/pdf") ||
                  /\.pdf$/i.test((targetUrl || "").split("?")[0]);

                if (isImage && targetUrl) {
                  return (
                    <img
                      src={targetUrl}
                      alt={previewDoc.name}
                      className="max-h-[55vh] object-contain rounded-lg"
                    />
                  );
                }
                if (isPdf && targetUrl) {
                  return (
                    <iframe
                      src={targetUrl}
                      title={previewDoc.name}
                      className="w-full h-96 rounded-lg border border-slate-200"
                    />
                  );
                }
                return (
                  <div className="text-center py-12 text-slate-500">
                    <FiFile className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs font-semibold">
                      Preview not supported for this file format.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2">
              {(() => {
                const downloadUrl = resolveMediaUrl(previewDoc.previewUrl || previewDoc.dataUrl || previewDoc.url);
                return (
                  <a
                    href={downloadUrl}
                    download={previewDoc.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                  >
                    Download Document
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
