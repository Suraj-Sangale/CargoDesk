"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import CustomSearch from "../common/customSearch";
import { useFleetDriver } from "@/context/fleetDriverContext";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
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

export default function DriverForm({
  setDriverList,
  modalData,
  isEdit,
  onClose,
  toggleModal,
}) {
  const { fleets, refreshAll } = useFleetDriver();

  const [profilePhoto, setProfilePhoto] = useState("");
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedFleetId, setSelectedFleetId] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const profileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
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
    },
  });

  // Populate data when editing
  useEffect(() => {
    if (isEdit && modalData) {
      reset({
        driver_name: modalData.driver_name || modalData.name || "",
        contact_number: modalData.contact_number || modalData.contactNo || "",
        alt_contact_number: modalData.alt_contact_number || "",
        license_number: modalData.license_number || "",
        license_type: modalData.license_type || DRIVER_LICENSE_TYPES[0],
        license_expiry: modalData.license_expiry || "",
        experience_years: modalData.experience_years || "5 Years",
        blood_group: modalData.blood_group || "B+",
        emergency_contact: modalData.emergency_contact || "",
        status: modalData.status || "Active",
        address: modalData.address || "",
        notes: modalData.notes || modalData.note || "",
      });

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

      setProfilePhoto(modalData.profile_photo || "");

      // Parse supporting docs if JSON string or array
      if (modalData.supporting_documents) {
        if (Array.isArray(modalData.supporting_documents)) {
          setSupportingDocs(modalData.supporting_documents);
        } else {
          try {
            const parsed = JSON.parse(modalData.supporting_documents);
            setSupportingDocs(Array.isArray(parsed) ? parsed : []);
          } catch (_) {
            setSupportingDocs([]);
          }
        }
      } else {
        setSupportingDocs([]);
      }
    } else {
      reset({
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
      });
      setSelectedFleetId("");
      setProfilePhoto("");
      setSupportingDocs([]);
    }
  }, [isEdit, modalData, reset, fleets]);

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
    if (!modalData?.id) return true; // Adding new driver and fleet is already assigned
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

  // Handle Profile Photo selection with automatic client-side compression
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, JPEG, WEBP)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePhoto(compressedDataUrl);
        showToast("Profile photo loaded & optimized", "success");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle Supporting Documents upload
  const handleSupportingDocsUpload = (files) => {
    if (!files || files.length === 0) return;

    const newDocs = [];
    let count = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        showToast(`${file.name} exceeds 15MB limit`, "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const docObj = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: event.target.result,
          uploadedAt: new Date().toISOString(),
        };

        newDocs.push(docObj);
        count++;

        if (count === files.length) {
          setSupportingDocs((prev) => [...prev, ...newDocs]);
          showToast(`${newDocs.length} document(s) added successfully`, "success");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a document
  const handleRemoveDoc = (id) => {
    setSupportingDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const onSubmit = async (data) => {
    setApiLoading(true);

    const parsedFleetId =
      selectedFleetId !== "" && Number(selectedFleetId) > 0
        ? Number(selectedFleetId)
        : null;

    const payload = {
      driver_name: data.driver_name ? data.driver_name.trim() : "",
      contact_number: data.contact_number ? data.contact_number.trim() : "",
      alt_contact_number: data.alt_contact_number ? data.alt_contact_number.trim() : "",
      license_number: data.license_number
        ? data.license_number.toUpperCase().trim()
        : "",
      license_type: data.license_type || "",
      license_expiry: data.license_expiry || "",
      assigned_vehicle: selectedFleet?.vehicle_number || "",
      fleet_id: parsedFleetId,
      experience_years: data.experience_years ? data.experience_years.trim() : "",
      blood_group: data.blood_group || "",
      emergency_contact: data.emergency_contact ? data.emergency_contact.trim() : "",
      status: data.status || "Active",
      profile_photo: profilePhoto || null,
      supporting_documents: supportingDocs.length > 0 ? JSON.stringify(supportingDocs) : null,
      address: data.address ? data.address.trim() : "",
      notes: data.notes ? data.notes.trim() : "",
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
        response.message || (isEdit ? "Driver updated successfully" : "Driver added successfully"),
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

    setApiLoading(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-5 md:p-6 space-y-5 max-h-[82vh] overflow-y-auto"
      >
        {/* 1. Profile Photo Header Banner */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-2xs">
          {/* Avatar / Photo preview */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md flex items-center justify-center text-slate-400 relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Driver Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  <FiUser className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Quick Camera Overlay Button */}
            <button
              type="button"
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
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Upload a clear frontal photo for identity badges and dispatch verification.
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
                onClick={() => profileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              >
                {profilePhoto ? "Change Photo" : "Upload Photo"}
              </button>
              {profilePhoto && (
                <button
                  type="button"
                  onClick={() => setProfilePhoto("")}
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Driver Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Sharma"
                {...register("driver_name", {
                  required: "Driver name is required",
                })}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                  errors.driver_name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
                } outline-none focus:ring-2 transition-all shadow-2xs font-semibold placeholder-slate-400`}
              />
              {errors.driver_name && (
                <p className="text-rose-500 text-xs font-medium mt-1">
                  {errors.driver_name.message}
                </p>
              )}
            </div>

            {/* Primary Mobile Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98201 44552"
                {...register("contact_number", {
                  required: "Primary mobile number is required",
                })}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                  errors.contact_number
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
                } outline-none focus:ring-2 transition-all shadow-2xs font-semibold placeholder-slate-400`}
              />
              {errors.contact_number && (
                <p className="text-rose-500 text-xs font-medium mt-1">
                  {errors.contact_number.message}
                </p>
              )}
            </div>

            {/* Alternate Mobile Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alternate Contact{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98201 44550"
                {...register("alt_contact_number")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Blood Group
              </label>
              <select
                {...register("blood_group")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
              >
                {DRIVER_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Driving License No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MH04 20150012345"
                {...register("license_number", {
                  required: "Driving License number is required",
                  onChange: (e) =>
                    setValue("license_number", e.target.value.toUpperCase()),
                })}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                  errors.license_number
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
                } outline-none focus:ring-2 transition-all shadow-2xs uppercase placeholder:normal-case font-mono font-semibold`}
              />
              {errors.license_number && (
                <p className="text-rose-500 text-xs font-medium mt-1">
                  {errors.license_number.message}
                </p>
              )}
            </div>

            {/* License Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                License Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("license_type", {
                  required: "License Category is required",
                })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
              >
                {DRIVER_LICENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* License Expiry Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                License Expiry Date
              </label>
              <input
                type="date"
                {...register("license_expiry")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium"
              />
            </div>

            {/* Driving Experience */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Total Driving Experience
              </label>
              <input
                type="text"
                placeholder="e.g. 8 Years / 12 Years"
                {...register("experience_years")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 4. Supporting Documents Upload Section */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
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
              <div className="text-xs font-bold text-slate-700">
                Attached Documents:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {supportingDocs.map((doc) => {
                  const isImage = doc.type?.startsWith("image/") || doc.dataUrl?.startsWith("data:image/");
                  const isPdf = doc.type === "application/pdf" || doc.name?.endsWith(".pdf");

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isImage ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                            <img
                              src={doc.dataUrl}
                              alt={doc.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                            isPdf ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            <FiFile className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                      </div>

                      {/* View & Remove actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Document"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
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
            <div className="md:col-span-2 space-y-2">
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
                    onClick={() => setSelectedFleetId("")}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Unassign Vehicle
                  </button>
                </div>
              )}
            </div>

            {/* Operational Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Operational Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
              >
                {DRIVER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Emergency Contact & Relation
              </label>
              <input
                type="text"
                placeholder="e.g. Sunita Sharma (Wife) - +91 98201 11223"
                {...register("emergency_contact")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
              />
            </div>

            {/* Residential Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Residential Address
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 302, Sai Krupa Heights, Thane West, Maharashtra - 400601"
                {...register("address")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notes & Special Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Certified for handling hazardous freight and multi-axle trailers..."
                {...register("notes")}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 sticky bottom-0 bg-white py-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={apiLoading}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
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
                <span>Saving Driver...</span>
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
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              {previewDoc.type?.startsWith("image/") || previewDoc.dataUrl?.startsWith("data:image/") ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[55vh] object-contain rounded-lg"
                />
              ) : previewDoc.type === "application/pdf" || previewDoc.name?.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-96 rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FiFile className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-semibold">Preview not supported for this file format.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <a
                href={previewDoc.dataUrl}
                download={previewDoc.name}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                Download Document
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
