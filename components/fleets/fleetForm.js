"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import CustomSearch from "../common/customSearch";
import { useFleetDriver } from "@/context/fleetDriverContext";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { vehicleNoListArr } from "@/utilities/dummyData";
import {
  FLEET_VEHICLE_TYPES,
  FLEET_FUEL_TYPES,
  FLEET_OWNERSHIP_TYPES,
  FLEET_STATUS_OPTIONS,
} from "@/utilities/masterData";
import {
  FiTruck,
  FiUser,
  FiFileText,
  FiCheck,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export default function FleetForm({
  setFleetList,
  modalData,
  isEdit,
  onClose,
  toggleModal,
}) {
  const { drivers, refreshAll } = useFleetDriver();

  const defaultFormData = {
    vehicle_number: "",
    vehicle_model: "",
    vehicle_type: FLEET_VEHICLE_TYPES[0] || "Heavy Truck (16-25T)",
    capacity: "",
    fuel_type: "Diesel",
    ownership_type: "Owned",
    manufacturing_year: new Date().getFullYear().toString(),
    gps_tracking_id: "",
    chassis_number: "",
    engine_number: "",
    status: "Active",
    notes: "",
  };

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [apiLoading, setApiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultFormData,
  });

  // Populate data when editing
  useEffect(() => {
    if (isEdit && modalData) {
      reset({
        vehicle_number: modalData.vehicle_number || modalData.vehicleNo || "",
        vehicle_model: modalData.vehicle_model || "",
        vehicle_type: modalData.vehicle_type || FLEET_VEHICLE_TYPES[0],
        capacity: modalData.capacity || "",
        fuel_type: modalData.fuel_type || "Diesel",
        ownership_type: modalData.ownership_type || "Owned",
        manufacturing_year: modalData.manufacturing_year || "",
        gps_tracking_id: modalData.gps_tracking_id || "",
        chassis_number: modalData.chassis_number || "",
        engine_number: modalData.engine_number || "",
        status: modalData.status || "Active",
        notes: modalData.notes || modalData.note || "",
      });

      // Find driver assigned to this fleet
      let initialDriverId = "";
      if (modalData.driver_id) {
        initialDriverId = modalData.driver_id;
      } else {
        const assigned = drivers.find((d) => Number(d.fleet_id) === Number(modalData.id));
        if (assigned) {
          initialDriverId = assigned.id;
        }
      }
      setSelectedDriverId(initialDriverId ? String(initialDriverId) : "");
    } else {
      reset(defaultFormData);
      setSelectedDriverId("");
    }
  }, [isEdit, modalData, reset, drivers]);

  // Construct options for CustomSearch
  const driverOptions = useMemo(() => {
    const opts = [
      {
        value: "",
        label: "-- Unassigned (No Driver) --",
      },
    ];

    drivers.forEach((d) => {
      const isCurrentFleet = modalData?.id && Number(d.fleet_id) === Number(modalData.id);
      const isAssignedElsewhere = d.fleet_id && !isCurrentFleet;

      opts.push({
        value: String(d.id),
        id: d.id,
        label: `${d.driver_name} (${d.contact_number || "No Contact"})${
          isCurrentFleet
            ? " [Currently Assigned]"
            : isAssignedElsewhere
            ? ` [Assigned: ${d.assigned_vehicle || "Vehicle"}]`
            : " [Available]"
        }`,
        driver: d,
      });
    });

    return opts;
  }, [drivers, modalData]);

  // Find currently selected driver object for preview
  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return drivers.find((d) => String(d.id) === String(selectedDriverId)) || null;
  }, [selectedDriverId, drivers]);

  // Check if selected driver is currently assigned elsewhere
  const isDriverReassigned = useMemo(() => {
    if (!selectedDriver || !selectedDriver.fleet_id) return false;
    if (!modalData?.id) return true; // Adding new fleet and driver already has a fleet
    return Number(selectedDriver.fleet_id) !== Number(modalData.id);
  }, [selectedDriver, modalData]);

  const handleClose = () => {
    if (onClose) onClose();
    if (toggleModal) toggleModal();
  };

  const onSubmit = async (data) => {
    setApiLoading(true);

    const parsedDriverId =
      selectedDriverId !== "" && Number(selectedDriverId) > 0
        ? Number(selectedDriverId)
        : null;

    const payload = {
      vehicle_number: data.vehicle_number
        ? data.vehicle_number.toUpperCase().trim()
        : "",
      vehicle_model: data.vehicle_model ? data.vehicle_model.trim() : "",
      vehicle_type: data.vehicle_type || "",
      capacity: data.capacity ? data.capacity.trim() : "",
      fuel_type: data.fuel_type || "Diesel",
      ownership_type: data.ownership_type || "Owned",
      manufacturing_year: data.manufacturing_year
        ? data.manufacturing_year.trim()
        : "",
      gps_tracking_id: data.gps_tracking_id
        ? data.gps_tracking_id.trim()
        : "",
      chassis_number: data.chassis_number ? data.chassis_number.trim() : "",
      engine_number: data.engine_number ? data.engine_number.trim() : "",
      status: data.status || "Active",
      notes: data.notes ? data.notes.trim() : "",
      driver_id: parsedDriverId,
    };

    let response;
    if (isEdit) {
      payload.id = modalData.id;
      response = await postApiData("UPDATE_FLEET", payload);
    } else {
      response = await postApiData("ADD_NEW_FLEET", payload);
    }

    if (response && response.status) {
      showToast(
        response.message || (isEdit ? "Fleet updated successfully" : "Fleet added successfully"),
        "success"
      );

      // Refresh synchronized context datasets
      await refreshAll();

      if (setFleetList) {
        // Also update local list if provided
        if (isEdit) {
          setFleetList((prev) =>
            prev.map((item) =>
              item.id == modalData.id
                ? {
                    ...item,
                    ...payload,
                    id: modalData.id,
                    driver_id: parsedDriverId,
                    driver_name: selectedDriver?.driver_name || null,
                    driver_contact: selectedDriver?.contact_number || null,
                  }
                : item
            )
          );
        } else {
          setFleetList((prev) => [
            {
              ...payload,
              id: response.id || Date.now(),
              driver_id: parsedDriverId,
              driver_name: selectedDriver?.driver_name || null,
              driver_contact: selectedDriver?.contact_number || null,
            },
            ...prev,
          ]);
        }
      }

      reset(defaultFormData);
      setSelectedDriverId("");
      handleClose();
    } else {
      showToast(response?.message || "Failed to save fleet record", "error");
    }

    setApiLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-5 md:p-6 space-y-5 max-h-[82vh] overflow-y-auto"
    >
      {/* 1. Vehicle Identity & Model */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiTruck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vehicle Identity & Specification
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Registration number, model, vehicle category and fuel
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle Registration Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Vehicle Registration No. <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="fleetVehicleSuggestions"
              placeholder="e.g. MH 04 EF 9101"
              {...register("vehicle_number", {
                required: "Vehicle Registration Number is required",
                onChange: (e) =>
                  setValue("vehicle_number", e.target.value.toUpperCase()),
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.vehicle_number
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs uppercase placeholder:normal-case font-semibold`}
            />
            <datalist id="fleetVehicleSuggestions">
              {vehicleNoListArr.map((item) => (
                <option key={item.id} value={item.label} />
              ))}
            </datalist>
            {errors.vehicle_number && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.vehicle_number.message}
              </p>
            )}
          </div>

          {/* Model & Make */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Make & Model <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tata Prima 5530.S / Ashok Leyland 2820"
              {...register("vehicle_model", {
                required: "Make & Model is required",
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.vehicle_model
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-medium placeholder-slate-400`}
            />
            {errors.vehicle_model && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.vehicle_model.message}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Vehicle Type / Body <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("vehicle_type", {
                required: "Vehicle Type is required",
              })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              {FLEET_VEHICLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Fuel Type
            </label>
            <select
              {...register("fuel_type")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              {FLEET_FUEL_TYPES.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Capacity & Ownership */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiShield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Payload, Ownership & Tracking
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Capacity payload, manufacturing year, ownership and GPS tracking
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payload Capacity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payload Capacity <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 25 Tons / 35 Tons / 18 Cu.M"
              {...register("capacity", {
                required: "Payload Capacity is required",
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.capacity
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-semibold placeholder-slate-400`}
            />
            {errors.capacity && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {/* Manufacturing Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Manufacturing / Model Year
            </label>
            <input
              type="number"
              min="1990"
              max="2035"
              placeholder="e.g. 2023"
              {...register("manufacturing_year")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
            />
          </div>

          {/* Ownership Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ownership Type
            </label>
            <select
              {...register("ownership_type")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              {FLEET_OWNERSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Tracking Device ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              GPS Tracking ID / Fastag{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. GPS-TRK-9101"
              {...register("gps_tracking_id")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-mono font-medium placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Driver Assignment (Single Source of Truth via customSearch) */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shadow-2xs">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assigned Driver Details
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Search and assign a registered driver to this vehicle
              </p>
            </div>
          </div>
          {selectedDriver && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Driver Assigned
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Driver Selection Dropdown using CustomSearch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Transport Driver
            </label>
            <CustomSearch
              name="driver_id"
              id="fleet_driver_select"
              value={selectedDriverId}
              options={driverOptions}
              placeholder="Search by driver name or contact number..."
              onChange={(opt) => {
                const val = opt?.value !== undefined ? opt.value : opt || "";
                setSelectedDriverId(val ? String(val) : "");
              }}
            />
          </div>

          {/* Reassignment Warning Banner */}
          {isDriverReassigned && selectedDriver && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Reassignment Notice: </span>
                <span>
                  <strong>{selectedDriver.driver_name}</strong> is currently assigned to vehicle{" "}
                  <strong>{selectedDriver.assigned_vehicle || "another vehicle"}</strong>. Saving this fleet
                  will reassign them to this vehicle.
                </span>
              </div>
            </div>
          )}

          {/* Driver Info Card */}
          {selectedDriver && (
            <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {selectedDriver.profile_photo ? (
                    <img
                      src={selectedDriver.profile_photo}
                      alt={selectedDriver.driver_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {(selectedDriver.driver_name || "D")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {selectedDriver.driver_name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    📞 {selectedDriver.contact_number || "No Contact"} •{" "}
                    <span className="font-mono">{selectedDriver.license_number || "DL"}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {selectedDriver.license_type || "HTV"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDriverId("")}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Unassign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Operational Status & Notes */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiFileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Operational Status & Notes
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Current vehicle operational status and special maintenance notes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Operational Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              {FLEET_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notes & Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Dedicated for North Corridor route. Tyre replacement scheduled next month..."
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
              <span>Saving Fleet...</span>
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{isEdit ? "Update Fleet Vehicle" : "Save Fleet Vehicle"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
