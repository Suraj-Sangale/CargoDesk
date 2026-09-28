"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import moment from "moment";
import { DOCUMENTS_TYPE_LIST } from "@/utilities/dummyData";
import { getConstant } from "@/utilities/utils";
import { useFleetDriver } from "@/context/fleetDriverContext";
import {
  FloatingInput,
  FloatingSelect,
  FloatingDatePicker,
  FloatingTextarea,
} from "../floatingInput";
import { FiMic, FiCheck, FiFileText } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import useAutoFocusField from "@/hooks/useAutoFocusField";

const defaultValues = {
  fleet_id: "",
  documentType: "",
  expiryDate: moment().format("YYYY-MM-DD"),
  note: "",
};

export default function AddDocumentForm({
  setReminderModal,
  addReminderData,
  reminderData,
  isEdit,
  setIsEdit,
  focusField,
  updateReminderData,
  isLoading,
}) {
  const [isListening, setIsListening] = useState(false);
  const { fleets = [], refreshFleets } = useFleetDriver() || {};

  useEffect(() => {
    if (Array.isArray(fleets) && fleets.length === 0 && refreshFleets) {
      refreshFleets();
    }
  }, [fleets, refreshFleets]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
  });

  const watchedNote = watch("note");

  // Dynamic vehicle options keyed by unique vehicle primary ID (fleet_id)
  const vehicleOptions = useMemo(() => {
    const list = [{ value: "", label: "Select Vehicle" }];
    const seen = new Set();

    if (Array.isArray(fleets)) {
      fleets.forEach((f) => {
        if (f.id && !seen.has(f.id)) {
          seen.add(f.id);
          const vNum = f.vehicle_number?.trim() || `Vehicle #${f.id}`;
          const labelSuffix = f.vehicle_model
            ? ` (${f.vehicle_model})`
            : f.vehicle_type
            ? ` (${f.vehicle_type})`
            : "";
          list.push({
            value: String(f.id),
            label: `${vNum}${labelSuffix}`,
            id: f.id,
            vehicle_number: f.vehicle_number,
            fleet: f,
          });
        }
      });
    }

    return list;
  }, [fleets]);

  // Standardized document type options
  const documentTypeOptions = useMemo(() => {
    return [
      { value: "", label: "Select Document Type" },
      ...DOCUMENTS_TYPE_LIST.map((d) => ({
        value: (d.value || d.label).toLowerCase(),
        label: d.label,
      })),
    ];
  }, []);

  // Sync form values on edit, prefill, or reset
  useEffect(() => {
    if (reminderData) {
      let fleetIdVal = "";
      if (reminderData.fleet_id) {
        fleetIdVal = String(reminderData.fleet_id);
      } else if (reminderData.fleetId) {
        fleetIdVal = String(reminderData.fleetId);
      } else if (reminderData.id && !reminderData.documentType && !reminderData.loan_amount) {
        fleetIdVal = String(reminderData.id);
      }

      // If fleet ID not provided directly, match from vehicleNo / vehicle_number
      if (!fleetIdVal) {
        const vNo = String(reminderData.vehicleNo || reminderData.vehicle_number || "").toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
        if (vNo) {
          const matched = vehicleOptions.find((opt) => {
            const optVeh = String(opt.vehicle_number || opt.label || "").toUpperCase().replace(/[^a-zA-Z0-9]/g, "");
            return optVeh === vNo;
          });
          if (matched && matched.value) {
            fleetIdVal = String(matched.value);
          }
        }
      }

      // Resolve documentType
      let docType = "";
      if (typeof reminderData.documentType === "object" && reminderData.documentType !== null) {
        docType = reminderData.documentType.value || reminderData.documentType.label || "";
      } else if (reminderData.documentType) {
        docType = String(reminderData.documentType);
      }

      const matchedDoc = documentTypeOptions.find(
        (opt) =>
          opt.value?.toLowerCase() === docType.toLowerCase() ||
          opt.label?.toLowerCase() === docType.toLowerCase()
      );
      if (matchedDoc && matchedDoc.value) {
        docType = matchedDoc.value;
      }

      const expDate = reminderData.expiryDate
        ? moment(reminderData.expiryDate).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");

      reset({
        fleet_id: fleetIdVal,
        documentType: docType,
        expiryDate: expDate,
        note: reminderData.note || "",
      });
    } else {
      reset(defaultValues);
    }
  }, [isEdit, reminderData, reset, vehicleOptions, documentTypeOptions]);

  // Reusable platform-wide auto-scroll and highlight target field (only when triggered from table cell)
  useAutoFocusField(focusField, Boolean(focusField), [reminderData, isEdit]);

  // Speech recognition handler
  const handleSpeechRecognition = () => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      showToast({
        message: "Speech recognition is not supported in this browser.",
        type: "error",
      });
      return;
    }

    try {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const current = watchedNote ? `${watchedNote} ` : "";
        setValue("note", `${current}${transcript}`.trim());
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const onSubmit = (data) => {
    const formattedExpiryDate = data.expiryDate
      ? moment(data.expiryDate).toISOString()
      : moment().toISOString();

    const selectedVehicleObj = vehicleOptions.find(
      (v) => String(v.value) === String(data.fleet_id) || String(v.id) === String(data.fleet_id)
    );
    const selectedDocObj = documentTypeOptions.find(
      (d) =>
        d.value?.toLowerCase() === String(data.documentType).toLowerCase() ||
        d.label?.toLowerCase() === String(data.documentType).toLowerCase()
    );

    const primaryFleetId = Number(data.fleet_id) || selectedVehicleObj?.id || reminderData?.fleet_id || reminderData?.fleetId || null;

    const payload = {
      ...reminderData,
      id: reminderData?.id,
      fleet_id: primaryFleetId,
      fleetId: primaryFleetId,
      vehicleNo: selectedVehicleObj?.vehicle_number || selectedVehicleObj?.label || "",
      documentType: data.documentType,
      expiryDate: formattedExpiryDate,
      note: data.note ? data.note.trim() : "",
      vehicleObj: selectedVehicleObj,
      docObj: selectedDocObj,
    };

    if (isEdit && updateReminderData) {
      updateReminderData(payload);
    } else if (addReminderData) {
      addReminderData(payload);
    }

    if (setReminderModal) {
      setReminderModal(false);
    }
    reset(defaultValues);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-3 space-y-4 bg-slate-50">
      {/* Vehicle Selection Field (Primary ID: fleet_id) */}
      <div data-field-container data-field="fleet_id">
        <Controller
          name="fleet_id"
          control={control}
          rules={{ required: "Please select a vehicle" }}
          render={({ field }) => (
            <FloatingSelect
              id="doc_fleet_id"
              name="fleet_id"
              label="Select Vehicle"
              required
              options={vehicleOptions}
              error={errors.fleet_id}
              value={field.value}
              selectedValue={field.value}
              onChange={(val) => {
                const actualVal =
                  val && typeof val === "object"
                    ? val.value !== undefined
                      ? val.value
                      : val.target?.value
                    : val;
                field.onChange(actualVal ? String(actualVal) : "");
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

      {/* Document Type Field */}
      <div data-field-container data-field="documentType">
        <Controller
          name="documentType"
          control={control}
          rules={{ required: "Please select document type" }}
          render={({ field }) => (
            <FloatingSelect
              id="doc_type"
              name="documentType"
              label="Document Type"
              required
              options={documentTypeOptions}
              error={errors.documentType}
              value={field.value}
              selectedValue={field.value}
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
            />
          )}
        />
      </div>

      {/* Expiry Date Field with Material UI X Date Picker */}
      <div data-field-container data-field="expiryDate">
        <Controller
          name="expiryDate"
          control={control}
          rules={{ required: "Please enter the expiry date" }}
          render={({ field }) => (
            <FloatingDatePicker
              id="doc_expiry_date"
              name="expiryDate"
              label="Select Expiry Date"
              required
              format="DD/MM/YYYY"
              error={errors.expiryDate}
              value={field.value}
              onChange={(val) => {
                const formatted =
                  val && moment(val).isValid()
                    ? moment(val).format("YYYY-MM-DD")
                    : val;
                field.onChange(formatted);
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

      {/* Add Note with Voice Recording */}
      <div data-field-container data-field="note">
        <FloatingInput
          id="doc_note"
          name="note"
          label="Add Note (Optional)"
          placeholder="Type or click mic to speak..."
          error={errors.note}
          rightElement={
            <button
              type="button"
              tabIndex={-1}
              onClick={handleSpeechRecognition}
              title={isListening ? "Listening..." : "Voice input"}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <FiMic className="w-4 h-4" />
            </button>
          }
          {...register("note")}
        />
      </div>

      {/* Form Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-2">
        {setReminderModal && (
          <button
            type="button"
            onClick={() => setReminderModal(false)}
            disabled={isLoading}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <ImSpinner9 className="w-4 h-4 animate-spin" />
              <span>{getConstant("LOADING_TEXT") || "Saving..."}</span>
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{isEdit ? "Update Document" : "Save Document"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
