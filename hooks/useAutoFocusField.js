"use client";

import { useEffect } from "react";

/**
 * Universal platform field alias mapping.
 * Maps any table column ID, API key, or form field name to standard DOM IDs and data-field attributes.
 */
export const GLOBAL_FIELD_MAP = {
  // Vehicle / Fleet fields
  vehicleNo: "doc_vehicle_no",
  vehicle_number: "vehicle_number",
  vehicle: "doc_vehicle_no",
  assigned_vehicle: "assigned_vehicle",
  fleet_id: "assigned_vehicle",
  vehicle_model: "vehicle_model",
  model: "vehicle_model",
  vehicle_type: "vehicle_type",
  fuel_type: "fuel_type",
  capacity: "capacity",
  manufacturing_year: "manufacturing_year",
  ownership_type: "ownership_type",
  chassis_number: "chassis_number",
  engine_number: "engine_number",
  insurance_number: "insurance_number",
  permit_number: "permit_number",

  // Driver fields
  driver_name: "driver_name",
  name: "driver_name",
  driver: "driver_name",
  contact_number: "contact_number",
  contact: "contact_number",
  contactNo: "contact_number",
  alt_contact_number: "alt_contact_number",
  blood_group: "blood_group",
  license_number: "license_number",
  license_type: "license_type",
  license_expiry: "license_expiry",
  experience_years: "experience_years",
  experience: "experience_years",
  emergency_contact: "emergency_contact",
  address: "address",
  status: "status",

  // Document fields
  documentType: "doc_type",
  doc_type: "doc_type",
  type: "doc_type",
  document_type: "doc_type",
  expiryDate: "doc_expiry_date",
  doc_expiry_date: "doc_expiry_date",
  expiry_date: "doc_expiry_date",
  issue_date: "issue_date",
  due_date: "due_date",
  start_date: "start_date",
  date: "doc_expiry_date",

  // Notes & Details
  note: "doc_note",
  notes: "notes",
  doc_note: "doc_note",
  description: "description",
  priority: "reminder_priority",

  // Media & Attachments
  profile_photo: "profile_photo",
  photo: "profile_photo",
  avatar: "profile_photo",
  supporting_documents: "supporting_documents",
  documents: "supporting_documents",

  // EMI & Finance fields
  loan_name: "loan_name",
  bank_name: "bank_name",
  loan_amount: "loan_amount",
  interest_rate: "interest_rate",
  tenure_months: "tenure_months",
  monthly_emi: "monthly_emi",
  emis_paid: "emis_paid",
};

/**
 * Imperative function to highlight and focus a field by name or ID.
 *
 * @param {string} fieldName - The name, id, or column key of the target field
 * @param {Object} [customMap={}] - Optional custom overrides for field mapping
 * @param {number} [duration=2200] - Duration of the glow highlight in ms
 */
export function highlightAndFocusField(fieldName, customMap = {}, duration = 2200) {
  if (!fieldName || typeof document === "undefined") return false;

  const mergedMap = { ...GLOBAL_FIELD_MAP, ...customMap };
  const targetKey = mergedMap[fieldName] || fieldName;

  const isHiddenInput = (node) => node && node.tagName === "INPUT" && node.type === "hidden";

  // Search by priority: exact ID -> data-field -> name -> contains id
  let el = document.getElementById(targetKey);
  if (isHiddenInput(el)) {
    el =
      el.parentElement?.querySelector('[tabindex="0"]') ||
      document.querySelector(`[data-field="${targetKey}"]`);
  }

  if (!el) el = document.querySelector(`[data-field="${targetKey}"]`);
  if (!el) el = document.querySelector(`[name="${targetKey}"]:not([type="hidden"])`);
  if (!el) el = document.getElementById(fieldName);
  if (isHiddenInput(el)) {
    el =
      el.parentElement?.querySelector('[tabindex="0"]') ||
      document.querySelector(`[data-field="${fieldName}"]`);
  }
  if (!el) el = document.querySelector(`[data-field="${fieldName}"]`);
  if (!el) el = document.querySelector(`[name="${fieldName}"]:not([type="hidden"])`);
  if (!el) el = document.querySelector(`[id*="${targetKey}"]:not([type="hidden"])`);

  if (!el) return false;

  // Find the interactive container / wrapper to apply glowing focus effect
  const container =
    el.closest(".floating-group") ||
    el.closest("[data-field-container]") ||
    el.closest(".form-group") ||
    el.closest(".relative") ||
    el;

  // Smooth scroll into vertical center of modal/dialog
  container.scrollIntoView({ behavior: "smooth", block: "center" });

  // Add vibrant glowing highlight styling ring
  container.classList.add(
    "ring-4",
    "ring-[#4bb7ff]/60",
    "shadow-lg",
    "shadow-[#4bb7ff]/25",
    "bg-blue-50/50",
    "transition-all",
    "duration-500",
    "rounded-2xl"
  );

  // Focus the actual input/textarea/select/tabindex element
  let focusable =
    (el.tagName === "INPUT" && el.type !== "hidden") ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA" ||
    el.getAttribute("tabindex") === "0"
      ? el
      : el.querySelector('input:not([type="hidden"]), select, textarea, [tabindex="0"], button') ||
        container.querySelector('input:not([type="hidden"]), select, textarea, [tabindex="0"], button');

  if (focusable && typeof focusable.focus === "function") {
    try {
      focusable.focus({ preventScroll: true });
    } catch (_) {}
  }

  // Remove highlight after duration
  setTimeout(() => {
    container.classList.remove(
      "ring-4",
      "ring-[#4bb7ff]/60",
      "shadow-lg",
      "shadow-[#4bb7ff]/25",
      "bg-blue-50/50"
    );
  }, duration);

  return true;
}

/**
 * Reusable React Hook for auto-scrolling and highlighting focus fields across any modal/popup.
 *
 * @param {string|null} focusField - Target field identifier passed from table row/cell
 * @param {boolean} [isActive=true] - Guard flag (e.g., isEdit or modalOpen)
 * @param {Array} [deps=[]] - Additional dependency triggers
 * @param {Object} [customMap={}] - Optional custom mapping overrides
 * @param {number} [delay=280] - Milliseconds to wait for modal enter transition
 */
export default function useAutoFocusField(
  focusField,
  isActive = true,
  deps = [],
  customMap = {},
  delay = 280
) {
  useEffect(() => {
    if (!focusField || !isActive) return;

    const timer = setTimeout(() => {
      highlightAndFocusField(focusField, customMap);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusField, isActive, ...deps]);
}
