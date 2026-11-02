"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { showToast } from "@/utilities/toastService";
import { postApiData, uploadMediaFile, compressImageFile } from "@/utilities/services/apiService";
import {
  FiCamera,
  FiUploadCloud,
  FiMic,
  FiMicOff,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiGlobe,
  FiPlay,
  FiTrash2,
  FiSend,
  FiTruck,
  FiCheckCircle,
  FiSearch,
  FiChevronDown,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const MAX_ATTACHMENTS = 10;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
];

const QUICK_PROBLEM_CHIPS = [
  { label: "🚨 Breakdown", text: "Vehicle breakdown / stopped on road" },
  { label: "🛑 Brake Issue", text: "Brakes not working properly / strange noise" },
  { label: "🛞 Flat Tyre", text: "Tyre puncture / flat tyre" },
  { label: "💧 Oil Leak", text: "Engine oil or coolant leakage" },
  { label: "🔋 Battery Dead", text: "Battery dead / vehicle not starting" },
  { label: "⚠️ Engine Smoke", text: "Engine overheating / smoke from hood" },
];

/**
 * MaintenanceFormV2 - Ultra-Simple, Mobile-Friendly UI
 *
 * Designed for drivers and fleet operators with limited literacy or technical experience.
 * Minimal typing, large buttons, voice-to-text, and direct camera capture.
 */
export default function MaintenanceFormV2({
  preselectedVehicle = null,
  initialData = null,
  isEdit = false,
  onClose,
  onSuccess,
  resetOnSuccess = false,
  submitButtonText = "Save Maintenance Record",
}) {
  // 1. Vehicles Selection State
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    preselectedVehicle?.id
      ? String(preselectedVehicle.id)
      : initialData?.vehicle_id
      ? String(initialData.vehicle_id)
      : ""
  );
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [highlightedVehicleIndex, setHighlightedVehicleIndex] = useState(0);
  const vehicleDropdownRef = useRef(null);
  const vehicleInputRef = useRef(null);

  // 2. Problem Description & Voice State
  const [problemDescription, setProblemDescription] = useState(initialData?.description || "");
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState(null);

  // 3. Media Attachments State
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);

  // 4. Submission & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState("");
  const [formError, setFormError] = useState(null);

  // References
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechBaseTextRef = useRef("");

  // Load vehicles list if not preselected
  useEffect(() => {
    let isMounted = true;
    async function loadVehicles() {
      if (preselectedVehicle) return;
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
  }, [preselectedVehicle]);

  // Selected Vehicle Object
  const selectedVehicle = useMemo(() => {
    if (preselectedVehicle) return preselectedVehicle;
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || null;
  }, [vehicles, selectedVehicleId, preselectedVehicle]);

  // Sync input text when preselectedVehicle or selectedVehicle changes
  useEffect(() => {
    if (preselectedVehicle) {
      setVehicleSearchQuery(preselectedVehicle.vehicle_number || "");
    } else if (selectedVehicle) {
      setVehicleSearchQuery(selectedVehicle.vehicle_number || "");
    }
  }, [preselectedVehicle, selectedVehicle]);

  // Filter vehicles live as user types directly in the field
  const filteredVehicles = useMemo(() => {
    const query = vehicleSearchQuery.trim().toLowerCase();
    if (!query) return vehicles;

    // If query matches currently selected vehicle number, show all vehicles so user can pick another
    if (selectedVehicle && selectedVehicle.vehicle_number.toLowerCase() === query) {
      return vehicles;
    }

    return vehicles.filter((v) => {
      const num = (v.vehicle_number || "").toLowerCase();
      const model = (v.vehicle_model || "").toLowerCase();
      const type = (v.vehicle_type || "").toLowerCase();
      return num.includes(query) || model.includes(query) || type.includes(query);
    });
  }, [vehicles, vehicleSearchQuery, selectedVehicle]);

  // Close dropdown on outside click and restore selected vehicle number if valid
  useEffect(() => {
    function handleClickOutside(event) {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target)) {
        setIsVehicleDropdownOpen(false);
        if (selectedVehicle) {
          setVehicleSearchQuery(selectedVehicle.vehicle_number);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [selectedVehicle]);

  // Handle vehicle selection
  const handleSelectVehicle = (v) => {
    setSelectedVehicleId(String(v.id));
    setVehicleSearchQuery(v.vehicle_number);
    setIsVehicleDropdownOpen(false);
    if (formError) setFormError(null);
  };

  // Clear vehicle selection and focus input to type again
  const handleClearVehicle = (e) => {
    if (e) e.stopPropagation();
    setSelectedVehicleId("");
    setVehicleSearchQuery("");
    setIsVehicleDropdownOpen(true);
    if (vehicleInputRef.current) {
      vehicleInputRef.current.focus();
    }
  };

  // Keyboard navigation inside vehicle search input
  const handleVehicleKeyDown = (e) => {
    if (!isVehicleDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsVehicleDropdownOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedVehicleIndex((prev) =>
        prev < filteredVehicles.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedVehicleIndex((prev) =>
        prev > 0 ? prev - 1 : filteredVehicles.length - 1
      );
    } else if (e.key === "Enter") {
      if (isVehicleDropdownOpen && filteredVehicles[highlightedVehicleIndex]) {
        e.preventDefault();
        handleSelectVehicle(filteredVehicles[highlightedVehicleIndex]);
      }
    } else if (e.key === "Escape") {
      setIsVehicleDropdownOpen(false);
    }
  };

  // Format vehicle options for CustomSearch
  const vehicleOptions = useMemo(() => {
    if (preselectedVehicle) {
      return [
        {
          value: String(preselectedVehicle.id),
          label: `${preselectedVehicle.vehicle_number} — ${
            preselectedVehicle.vehicle_model || preselectedVehicle.vehicle_type || "Vehicle"
          }`,
        },
      ];
    }
    return vehicles.map((v) => ({
      value: String(v.id),
      label: `${v.vehicle_number} — ${v.vehicle_model || v.vehicle_type || "Vehicle"} (${
        v.status || "Active"
      })`,
    }));
  }, [vehicles, preselectedVehicle]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      attachedFiles.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch (_) {}
        }
      });
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [attachedFiles]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        // Iterate over full session results to compute current complete transcript
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + transcript.trim();
          } else {
            interimTranscript += (interimTranscript ? " " : "") + transcript.trim();
          }
        }

        const sessionSpeech = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
        if (sessionSpeech) {
          const base = speechBaseTextRef.current ? speechBaseTextRef.current.trim() : "";
          const combined = base ? `${base} ${sessionSpeech}` : sessionSpeech;
          setProblemDescription(combined);
          setFormError(null);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied. Please allow microphone in browser.");
        } else if (event.error === "network") {
          setSpeechError("Network error during speech recognition.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setProblemDescription((current) => {
          speechBaseTextRef.current = (current || "").trim();
          return current;
        });
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("SpeechRecognition init error:", e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [selectedLang]);

  // Toggle voice listening
  const toggleListening = () => {
    if (!speechSupported || isSubmitting) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
      speechBaseTextRef.current = (problemDescription || "").trim();
    } else {
      setSpeechError(null);
      // Capture current textarea text as base so new speech appends cleanly after existing text
      speechBaseTextRef.current = (problemDescription || "").trim();
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = selectedLang;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
      }
    }
  };

  // Process files selected from camera or file picker
  const handleFilesSelected = useCallback(
    async (incomingFileList) => {
      if (!incomingFileList || incomingFileList.length === 0) return;
      setFileError(null);

      const incomingArr = Array.from(incomingFileList);

      if (attachedFiles.length + incomingArr.length > MAX_ATTACHMENTS) {
        setFileError(`You can attach up to ${MAX_ATTACHMENTS} photos/videos.`);
      }

      const validFiles = [];
      const remainingSlots = MAX_ATTACHMENTS - attachedFiles.length;

      for (let i = 0; i < Math.min(incomingArr.length, remainingSlots); i++) {
        let file = incomingArr[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setFileError(`"${file.name}" is not supported. Please select photos or videos.`);
          continue;
        }

        // Optimize mobile camera images automatically on client to prevent 413 limits and speed up upload
        if (isImage) {
          try {
            file = await compressImageFile(file);
          } catch (_) {}
        }

        if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
          setFileError(`Photo "${file.name}" exceeds 10 MB limit.`);
          continue;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
          setFileError(`Video "${file.name}" exceeds 100 MB limit.`);
          continue;
        }

        const isDuplicate = attachedFiles.some(
          (existing) => existing.file?.name === file.name && existing.file?.size === file.size
        );
        if (isDuplicate) continue;

        const previewUrl = URL.createObjectURL(file);
        validFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          mediaType: isImage ? "image" : "video",
          previewUrl,
        });
      }

      if (validFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...validFiles]);
        setFileError(null);
        setFormError(null);
      }
    },
    [attachedFiles]
  );

  // Remove attached file
  const handleRemoveFile = (fileId) => {
    setAttachedFiles((prev) => {
      const target = prev.find((item) => item.id === fileId);
      if (target?.previewUrl && target.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch (_) {}
      }
      return prev.filter((item) => item.id !== fileId);
    });
  };

  // Quick problem chip click handler
  const handleChipClick = (chipText) => {
    setProblemDescription((prev) => {
      let next;
      if (!prev || prev.trim() === "") next = chipText;
      else if (prev.includes(chipText)) next = prev;
      else next = `${prev.trim()}, ${chipText}`;
      speechBaseTextRef.current = next;
      return next;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError(null);

    const vid = selectedVehicleId ? Number(selectedVehicleId) : null;
    if (!vid) {
      setFormError("Please select a vehicle number before submitting.");
      showToast({ message: "Please select a vehicle number", type: "error" });
      return;
    }

    if (!problemDescription || problemDescription.trim() === "") {
      setFormError("Please describe the problem or use the microphone to speak.");
      showToast({ message: "Please describe the problem", type: "error" });
      return;
    }

    if (attachedFiles.length === 0) {
      setFileError("Photo or video evidence is compulsory. Please take a photo or upload a file.");
      setFormError("Please take a photo or upload a file as evidence.");
      showToast({ message: "Photo or video evidence is compulsory", type: "error" });
      return;
    }

    // Stop speech recognition if listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    setIsSubmitting(true);
    setSubmissionProgress("Preparing report...");

    try {
      const uploadedMediaItems = [];

      // Step 1: Upload media files if any
      if (attachedFiles.length > 0) {
        setSubmissionProgress(`Authorizing ${attachedFiles.length} file(s)...`);

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
          throw new Error(presignJson?.message || "Failed to prepare file upload authorization.");
        }

        const presignedMap = {};
        presignJson.data.forEach((item) => {
          presignedMap[item.fileName] = item;
        });

        for (let i = 0; i < attachedFiles.length; i++) {
          const item = attachedFiles[i];
          const presignedInfo = presignedMap[item.fileName];

          if (!presignedInfo || !presignedInfo.uploadUrl) {
            throw new Error(`Upload authorization missing for file: ${item.fileName}`);
          }

          setSubmissionProgress(`Uploading photo ${i + 1} of ${attachedFiles.length}...`);

          await uploadMediaFile({
            uploadUrl: presignedInfo.uploadUrl,
            file: item.file,
            mimeType: item.mimeType,
            s3Key: presignedInfo.s3Key,
          });

          uploadedMediaItems.push({
            s3_key: presignedInfo.s3Key,
            file_name: item.fileName,
            mime_type: item.mimeType,
            file_size: item.fileSize,
            media_type: item.mediaType,
          });
        }
      }

      // Step 2: Save maintenance record in database
      setSubmissionProgress("Submitting problem report...");

      const payload = {
        vehicle_id: vid,
        maintenance_type: "Breakdown", // Default simple classification for quick issue reporting
        description: problemDescription.trim(),
        maintenance_date: new Date().toISOString().slice(0, 10),
        status: "Reported",
        cost: "0.00",
        odometer_reading: null,
        garage_name: null,
        invoice_number: null,
        additional_notes: null,
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
        throw new Error(saveJson?.message || "Failed to submit maintenance report.");
      }

      showToast({
        message: "Maintenance Record Saved Successfully!",
        type: "success",
      });

      // Reset form if resetOnSuccess is enabled or when used standalone without a modal onClose
      if (resetOnSuccess || !onClose) {
        if (!preselectedVehicle) {
          setSelectedVehicleId("");
          setVehicleSearchQuery("");
        }
        setProblemDescription("");
        attachedFiles.forEach((item) => {
          if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(item.previewUrl);
            } catch (_) {}
          }
        });
        setAttachedFiles([]);
        setFileError(null);
        setFormError(null);
      }

      if (onSuccess) {
        onSuccess(saveJson.data);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("V2 submission error:", err);
      setFormError(err.message || "Failed to submit report. Please check connection and try again.");
      showToast({
        message: err.message || "Failed to submit maintenance report.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress("");
    }
  };

  return (
    <div className="w-full">
      {/* Form Body */}
      <form onSubmit={handleSubmit} className="w-full p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Error Alert */}
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-700 animate-fadeIn">
            <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Backdrop overlay to make background slightly dark when vehicle search dropdown is open */}
        {isVehicleDropdownOpen && !preselectedVehicle && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-200 animate-fadeIn"
            onClick={() => {
              setIsVehicleDropdownOpen(false);
              if (selectedVehicle) {
                setVehicleSearchQuery(selectedVehicle.vehicle_number);
              }
            }}
            aria-hidden="true"
          />
        )}

        {/* 2. Vehicle Number Selection - Direct Typeable Field with Results at Bottom */}
        <div
          ref={vehicleDropdownRef}
          className={`space-y-2 w-full relative transition-all ${
            isVehicleDropdownOpen && !preselectedVehicle ? "z-50" : "z-10"
          }`}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="vehicle_number_input"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800"
            >
              {/* <FiTruck className="w-4 h-4 text-blue-600" /> */}
              <span>Select Vehicle Number</span>
              <span className="text-rose-500">*</span>
            </label>
            {preselectedVehicle && (
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Locked to Current Fleet
              </span>
            ) }
          </div>

          <div className="relative w-full">
            {/* Direct Typeable Input with Embedded Search Icon */}
            <div
              onClick={() => {
                if (!preselectedVehicle && !isSubmitting && vehicleInputRef.current) {
                  vehicleInputRef.current.focus();
                  setIsVehicleDropdownOpen(true);
                }
              }}
              className={`w-full min-h-[52px] px-3.5 py-2.5 flex items-center gap-2.5 bg-white rounded-2xl border-2 transition-all duration-200 shadow-xs cursor-text ${
                Boolean(preselectedVehicle) || isSubmitting
                  ? "bg-slate-100 opacity-70 cursor-not-allowed border-slate-200"
                  : isVehicleDropdownOpen
                  ? "border-blue-600 ring-4 ring-blue-100/70"
                  : selectedVehicleId
                  ? "border-blue-500 bg-blue-50/20 hover:border-blue-600"
                  : "border-slate-300 hover:border-blue-500"
              }`}
            >
              <FiSearch className="w-5 h-5 text-blue-600 shrink-0" />

              <input
                ref={vehicleInputRef}
                id="vehicle_number_input"
                name="vehicle_id"
                type="text"
                autoComplete="off"
                disabled={Boolean(preselectedVehicle) || isSubmitting}
                value={vehicleSearchQuery}
                placeholder={
                  loadingVehicles
                    ? "Loading vehicle list..."
                    : "Type vehicle number here (e.g. MH 12 AB 1234)..."
                }
                onFocus={() => {
                  if (!preselectedVehicle && !isSubmitting) {
                    setIsVehicleDropdownOpen(true);
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setVehicleSearchQuery(val);
                  setIsVehicleDropdownOpen(true);
                  if (
                    selectedVehicle &&
                    !selectedVehicle.vehicle_number.toLowerCase().includes(val.toLowerCase())
                  ) {
                    setSelectedVehicleId("");
                  }
                  if (formError) setFormError(null);
                }}
                onKeyDown={handleVehicleKeyDown}
                className="w-full bg-transparent text-slate-900 font-semibold text-sm sm:text-base outline-none placeholder:text-slate-400 placeholder:font-normal"
              />

              {/* Clear button */}
              {!preselectedVehicle && (vehicleSearchQuery || selectedVehicleId) && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleClearVehicle}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear vehicle search"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}

              {/* Toggle Dropdown Chevron */}
              {!preselectedVehicle && !isSubmitting && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVehicleDropdownOpen((prev) => !prev);
                    if (!isVehicleDropdownOpen && vehicleInputRef.current) {
                      vehicleInputRef.current.focus();
                    }
                  }}
                  className={`p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0 cursor-pointer ${
                    isVehicleDropdownOpen ? "rotate-180 text-blue-600 bg-blue-50" : ""
                  }`}
                  title="Toggle vehicle list"
                  aria-label="Toggle vehicle list"
                  tabIndex={-1}
                >
                  <FiChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Results List at bottom of input */}
            {isVehicleDropdownOpen && !preselectedVehicle && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border-2 border-slate-200/90 shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-slide-down">
                {loadingVehicles ? (
                  <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                    <ImSpinner9 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs font-semibold">Loading vehicles...</span>
                  </div>
                ) : filteredVehicles.length > 0 ? (
                  filteredVehicles.map((v, index) => {
                    const isSelected = String(v.id) === String(selectedVehicleId);
                    const isHighlighted = index === highlightedVehicleIndex;
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVehicle(v)}
                        onMouseEnter={() => setHighlightedVehicleIndex(index)}
                        className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/80 text-blue-900"
                            : isHighlighted
                            ? "bg-slate-50 text-slate-900"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <FiTruck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {v.vehicle_number}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">
                              {v.vehicle_model || v.vehicle_type || "Vehicle"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              v.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {v.status || "Active"}
                          </span>
                          {isSelected && (
                            <FiCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">
                      No vehicles found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      No vehicle matches &ldquo;{vehicleSearchQuery}&rdquo;. Try typing another registration number or model.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected vehicle preview pill or guidance text */}
          {/* {selectedVehicle && (
            <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-xl px-3 py-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-blue-950 truncate">
                  {selectedVehicle.vehicle_number}
                </span>
                <span className="text-slate-600 truncate">
                  • {selectedVehicle.vehicle_model || selectedVehicle.vehicle_type || "Vehicle"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full shrink-0">
                Vehicle Selected
              </span>
            </div>
          )} */}
        </div>

        {/* 3. Capture Photo & Upload File - Two Large Side-by-Side Buttons (Compulsory) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              Photos or Videos Evidence <span className="text-rose-500">*</span>
            </label>
            {attachedFiles.length > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <FiCheck className="w-3 h-3 text-emerald-600" />
                <span>{attachedFiles.length} Attached</span>
              </span>
            )}
          </div>
          {/* <p className="text-[11px] text-slate-500 font-medium">
            Please capture a photo or upload evidence from device (at least 1 photo/video required)
          </p> */}

          {/* Hidden Inputs */}
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
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Side by side 50% buttons */}
          <div
            className={`grid grid-cols-2 gap-3 sm:gap-4 transition-all rounded-2xl ${
              fileError && attachedFiles.length === 0
                ? "ring-2 ring-rose-300 p-1 bg-rose-50/30"
                : ""
            }`}
          >
            {/* Button A: Take Photo */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isSubmitting || attachedFiles.length >= MAX_ATTACHMENTS}
              className="group p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <FiCamera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="block text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Take Photo
                </span>
                <span className="text-[11px] font-semibold text-blue-600">
                  Open Camera *
                </span>
              </div>
            </button>

            {/* Button B: Upload File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || attachedFiles.length >= MAX_ATTACHMENTS}
              className="group p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/100 hover:bg-amber-50/40 text-amber-700 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <FiUploadCloud className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="block text-sm sm:text-base font-bold text-amber-900 leading-tight">
                  Upload File
                </span>
                <span className="text-[11px] font-semibold text-amber-600">
                  Gallery / Videos *
                </span>
              </div>
            </button>
          </div>

          {fileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 animate-fadeIn">
              <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{fileError}</span>
            </div>
          )}

          {/* 4. Selected Photo/Video Previews */}
          {attachedFiles.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2">
                <span>Attached Files ({attachedFiles.length}/{MAX_ATTACHMENTS})</span>
                <span className="text-[11px] text-slate-400">Tap × to remove</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {attachedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                  >
                    {item.mediaType === "image" ? (
                      <img
                        src={item.previewUrl}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                        <FiPlay className="w-6 h-6 text-indigo-600" />
                        <span className="text-[10px] font-bold">Video Clip</span>
                      </div>
                    )}

                    {/* File Size Badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/65 text-white text-[10px] font-medium backdrop-blur-xs">
                      {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(item.id)}
                      disabled={isSubmitting}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                      title="Remove file"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Maintenance Details with Voice-to-Text */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                What is the problem? <span className="text-rose-500">*</span>
              </label>
              {/* <p className="text-[11px] text-slate-500 font-medium">
                Type details or tap the microphone to speak
              </p> */}
            </div>

            {/* Language Switcher Pill for Speech */}
            {speechSupported && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2.5 py-1 border border-slate-200">
                <FiGlobe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  disabled={isListening || isSubmitting}
                  className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                  title="Select voice recognition language"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Problem Suggestion Chips for Fast Entry */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none my-3">
            {QUICK_PROBLEM_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip.text)}
                disabled={isSubmitting}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Textarea + Large Microphone Button */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={problemDescription}
              onChange={(e) => {
                const val = e.target.value;
                setProblemDescription(val);
                speechBaseTextRef.current = val;
                if (formError) setFormError(null);
              }}
              disabled={isSubmitting}
              placeholder="e.g. Brake noise, engine overheating, tyre flat, vehicle stopped on highway..."
              className={`w-full px-4 py-3 pb-14 text-sm sm:text-base font-normal text-slate-900 bg-white border rounded-2xl outline-none transition-all placeholder:text-slate-400 shadow-2xs resize-none ${
                isListening
                  ? "border-rose-400 ring-2 ring-rose-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
            />

            {/* Microphone Button Embedded in Corner */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {isListening && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Listening... Tap mic to stop</span>
                </div>
              )}

              {speechSupported ? (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isSubmitting}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 ${
                    isListening
                      ? "bg-rose-600 text-white animate-pulse shadow-rose-500/40"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25"
                  }`}
                  title={isListening ? "Stop listening" : "Tap to speak problem"}
                >
                  {isListening ? (
                    <FiMicOff className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiMic className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                  Mic unsupported
                </span>
              )}
            </div>
          </div>

          {/* Listening Indicator for Mobile */}
          {isListening && (
            <div className="sm:hidden p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs font-bold text-rose-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Listening... Speak now
              </span>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-md"
              >
                Done
              </button>
            </div>
          )}

          {speechError && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <FiAlertCircle className="w-3.5 h-3.5" />
              <span>{speechError}</span>
            </p>
          )}
        </div>

        {/* 6. Prominent Full-Width Submit Button */}
        <div className="pt-2 space-y-2.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <ImSpinner9 className="w-5 h-5 animate-spin" />
                <span>{submissionProgress || "Submitting Report..."}</span>
              </>
            ) : (
              <>
                <FiSend className="w-5 h-5" />
                <span>{submitButtonText || "Save Maintenance Record"}</span>
              </>
            )}
          </button>

          {/* 7. Clear Close/Cancel Action */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
            >
              Cancel and return
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

