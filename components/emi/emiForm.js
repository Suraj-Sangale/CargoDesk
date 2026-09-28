"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import moment from "moment";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { useFleetDriver } from "@/context/fleetDriverContext";
import useAutoFocusField from "@/hooks/useAutoFocusField";
import {
  FloatingInput,
  FloatingSelect,
  FloatingDatePicker,
  FloatingTextarea,
} from "../common/floatingInput";
import {
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiTrendingUp,
  FiCheck,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const FINANCIER_OPTIONS = [
  "HDFC Bank",
  "ICICI Bank",
  "Tata Capital",
  "Cholamandalam Finance",
  "Sundaram Finance",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Axis Bank",
  "State Bank of India (SBI)",
  "Shriram Finance",
  "Mahindra Finance",
  "Other",
];

const PAYMENT_MODES = [
  "NACH / Auto-Debit",
  "Bank Transfer (NEFT/RTGS)",
  "Cheque",
  "UPI",
  "Debit Card",
  "Cash",
];

const DEFAULT_EMI_DATA = {
  vehicle_number: "",
  loan_name: "",
  bank_name: "",
  loan_account_no: "",
  loan_amount: "",
  down_payment: "",
  emi_amount: "",
  interest_rate: "",
  tenure_months: "",
  emis_paid: "0",
  start_date: "",
  due_date: "",
  payment_mode: "NACH / Auto-Debit",
  status: "Active",
  notes: "",
};

export default function EmiForm({
  setEmiList,
  modalData,
  isEdit,
  focusField,
  onClose,
  toggleModal,
}) {
  const { fleets = [], refreshFleets } = useFleetDriver() || {};
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(fleets) && fleets.length === 0 && refreshFleets) {
      refreshFleets();
    }
  }, [fleets, refreshFleets]);

  const vehicleOptions = useMemo(() => {
    const list = [{ value: "", label: "Select Vehicle Number (Optional)" }];
    const seen = new Set();
    if (Array.isArray(fleets)) {
      fleets.forEach((f) => {
        const vNum = f.vehicle_number?.trim();
        if (vNum && !seen.has(vNum.toUpperCase())) {
          seen.add(vNum.toUpperCase());
          const labelSuffix = f.vehicle_model
            ? ` (${f.vehicle_model})`
            : f.vehicle_type
            ? ` (${f.vehicle_type})`
            : "";
          list.push({
            value: vNum,
            label: `${vNum}${labelSuffix}`,
            id: f.id,
            fleet: f,
          });
        }
      });
    }
    return list;
  }, [fleets]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: DEFAULT_EMI_DATA,
  });

  // Real-time financial calculations
  const watchedLoanAmount = useWatch({ control, name: "loan_amount" });
  const watchedEmiAmount = useWatch({ control, name: "emi_amount" });
  const watchedTenure = useWatch({ control, name: "tenure_months" });
  const watchedEmisPaid = useWatch({ control, name: "emis_paid" });
  const watchedStartDate = useWatch({ control, name: "start_date" });

  const loanAmt = parseFloat(watchedLoanAmount) || 0;
  const emiAmt = parseFloat(watchedEmiAmount) || 0;
  const tenure = parseInt(watchedTenure, 10) || 0;
  const paid = parseInt(watchedEmisPaid, 10) || 0;

  const totalPayable = emiAmt * tenure;
  const totalInterest = totalPayable > loanAmt ? totalPayable - loanAmt : 0;
  const remainingEmis = Math.max(0, tenure - paid);
  const remainingOutflow = remainingEmis * emiAmt;
  const estimatedEndDate =
    watchedStartDate && tenure > 0
      ? moment(watchedStartDate).add(tenure, "months").format("DD MMM YYYY")
      : null;

  // Populate data when editing or prefilling
  useEffect(() => {
    if (modalData) {
      reset({
        vehicle_number: modalData.vehicle_number || modalData.vehicleNo || "",
        loan_name: modalData.loan_name || "",
        bank_name: modalData.bank_name || "",
        loan_account_no: modalData.loan_account_no || "",
        loan_amount: modalData.loan_amount || "",
        down_payment: modalData.down_payment || "",
        emi_amount: modalData.emi_amount || "",
        interest_rate: modalData.interest_rate || "",
        tenure_months: modalData.tenure_months || "",
        emis_paid:
          modalData.emis_paid !== undefined && modalData.emis_paid !== null
            ? String(modalData.emis_paid)
            : "0",
        start_date: modalData.start_date
          ? moment(modalData.start_date).format("YYYY-MM-DD")
          : "",
        due_date: modalData.due_date
          ? moment(modalData.due_date).format("YYYY-MM-DD")
          : "",
        payment_mode: modalData.payment_mode || "NACH / Auto-Debit",
        status:
          modalData.status === 1 || modalData.status === "Active"
            ? "Active"
            : "Closed",
        notes: modalData.notes || modalData.note || "",
      });
    } else {
      reset(DEFAULT_EMI_DATA);
    }
  }, [isEdit, modalData, reset]);

  // Reusable platform-wide auto-scroll and highlight target field
  useAutoFocusField(focusField, Boolean(focusField), [modalData, isEdit]);

  const handleClose = () => {
    if (onClose) onClose();
    if (toggleModal) toggleModal();
  };

  const onSubmit = async (data) => {
    setApiLoading(true);

    const payload = {
      vehicle_number: data.vehicle_number
        ? data.vehicle_number.toUpperCase().trim()
        : "",
      loan_name: data.loan_name ? data.loan_name.trim() : "",
      bank_name: data.bank_name || "",
      loan_account_no: data.loan_account_no ? data.loan_account_no.trim() : "",
      loan_amount: data.loan_amount ? parseFloat(data.loan_amount) : 0,
      down_payment: data.down_payment ? parseFloat(data.down_payment) : null,
      emi_amount: data.emi_amount ? parseFloat(data.emi_amount) : 0,
      interest_rate: data.interest_rate ? parseFloat(data.interest_rate) : null,
      tenure_months: data.tenure_months ? parseInt(data.tenure_months, 10) : 0,
      emis_paid: data.emis_paid ? parseInt(data.emis_paid, 10) : 0,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      payment_mode: data.payment_mode || "",
      status: data.status === "Active" ? 1 : 0,
      notes: data.notes || "",
    };

    let response;
    if (isEdit) {
      payload.id = modalData.id;
      response = await postApiData("UPDATE_EMI_DETAILS", payload);
    } else {
      response = await postApiData("ADD_NEW_EMI", payload);
    }

    if (response && response.status) {
      if (isEdit) {
        setEmiList((prev) =>
          prev.map((emi) =>
            emi.id == modalData.id ? { ...emi, ...payload, id: modalData.id } : emi
          )
        );
        showToast(response.message || "EMI record updated successfully", "success");
      } else {
        showToast(response.message || "EMI record added successfully", "success");
        setEmiList((prev) => [
          { ...payload, id: response.id || Date.now() },
          ...prev,
        ]);
      }

      reset(DEFAULT_EMI_DATA);
      handleClose();
    } else {
      showToast(response?.message || "Failed to save EMI record", "error");
    }

    setApiLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 sm:px-6 py-4 space-y-4 bg-slate-50"
    >
      {/* 1. Vehicle & Lender Details Section */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiTruck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Vehicle & Financier Details
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Link the loan to a fleet vehicle and financial institution
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vehicle Number using dynamic fleets */}
          <div data-field-container data-field="vehicle_number">
            <Controller
              name="vehicle_number"
              control={control}
              render={({ field }) => (
                <FloatingSelect
                  id="emi_vehicle_number"
                  name="vehicle_number"
                  label="Vehicle Number (Optional)"
                  options={vehicleOptions}
                  error={errors.vehicle_number}
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
                />
              )}
            />
          </div>

          {/* Loan / Item Name */}
          <div data-field-container data-field="loan_name">
            <FloatingInput
              id="emi_loan_name"
              label="Loan / Item Name"
              required
              placeholder="e.g. Truck Chassis Loan, Vehicle EMI"
              error={errors.loan_name}
              {...register("loan_name", { required: "Loan Name is required" })}
            />
          </div>

          {/* Financier / Bank Name */}
          <div data-field-container data-field="bank_name">
            <FloatingInput
              id="emi_bank_name"
              label="Financier / Bank Name"
              list="bankOptionsList"
              placeholder="e.g. HDFC Bank, Tata Capital, Cholamandalam"
              error={errors.bank_name}
              {...register("bank_name")}
            >
              <datalist id="bankOptionsList">
                {FINANCIER_OPTIONS.map((bank) => (
                  <option key={bank} value={bank} />
                ))}
              </datalist>
            </FloatingInput>
          </div>

          {/* Loan Agreement / Account Number */}
          <div data-field-container data-field="loan_account_no">
            <FloatingInput
              id="emi_loan_account_no"
              label="Loan Agreement / A/C No."
              placeholder="e.g. LN-9842109"
              className="font-mono"
              error={errors.loan_account_no}
              {...register("loan_account_no")}
            />
          </div>
        </div>
      </div>

      {/* 2. Financial Breakdown Section */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiDollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Financial Breakdown
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Loan amount, monthly installment, and interest terms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loan Principal Amount */}
          <div data-field-container data-field="loan_amount">
            <FloatingInput
              id="emi_loan_amount"
              label="Loan Principal Amount (₹)"
              required
              type="number"
              step="any"
              placeholder="e.g. 1500000"
              className="font-semibold"
              error={errors.loan_amount}
              {...register("loan_amount", {
                required: "Loan Amount is required",
                min: { value: 1, message: "Must be greater than 0" },
              })}
            />
          </div>

          {/* Monthly EMI Amount */}
          <div data-field-container data-field="emi_amount">
            <FloatingInput
              id="emi_amount"
              label="Monthly EMI Amount (₹)"
              required
              type="number"
              step="any"
              placeholder="e.g. 42500"
              className="font-bold text-blue-600"
              error={errors.emi_amount}
              {...register("emi_amount", {
                required: "EMI Amount is required",
                min: { value: 1, message: "Must be greater than 0" },
              })}
            />
          </div>

          {/* Down Payment */}
          <div data-field-container data-field="down_payment">
            <FloatingInput
              id="emi_down_payment"
              label="Down Payment Paid (₹) (Optional)"
              type="number"
              step="any"
              placeholder="e.g. 250000"
              error={errors.down_payment}
              {...register("down_payment")}
            />
          </div>

          {/* Interest Rate */}
          <div data-field-container data-field="interest_rate">
            <FloatingInput
              id="emi_interest_rate"
              label="Interest Rate (% p.a.) (Optional)"
              type="number"
              step="0.01"
              placeholder="e.g. 9.5"
              error={errors.interest_rate}
              {...register("interest_rate")}
            />
          </div>
        </div>
      </div>

      {/* 3. Schedule & Payment Mode Section */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiCalendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Schedule & Tracking
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Tenure duration, due dates, and installment progress
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Tenure (Months) */}
          <div data-field-container data-field="tenure_months">
            <FloatingInput
              id="emi_tenure_months"
              label="Total Tenure (Months)"
              required
              type="number"
              placeholder="e.g. 36"
              error={errors.tenure_months}
              {...register("tenure_months", {
                required: "Tenure is required",
                min: { value: 1, message: "Must be at least 1 month" },
              })}
            />
          </div>

          {/* EMIs Paid */}
          <div data-field-container data-field="emis_paid">
            <FloatingInput
              id="emi_emis_paid"
              label="EMIs Paid So Far (Installments)"
              type="number"
              min="0"
              placeholder="e.g. 12"
              error={errors.emis_paid}
              {...register("emis_paid")}
            />
          </div>

          {/* Start Date using FloatingDatePicker */}
          <div data-field-container data-field="start_date">
            <Controller
              name="start_date"
              control={control}
              rules={{ required: "Start Date is required" }}
              render={({ field }) => (
                <FloatingDatePicker
                  id="emi_start_date"
                  name="start_date"
                  label="Loan Start Date"
                  required
                  format="DD/MM/YYYY"
                  error={errors.start_date}
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

          {/* Monthly Due Date using FloatingDatePicker */}
          <div data-field-container data-field="due_date">
            <Controller
              name="due_date"
              control={control}
              rules={{ required: "Due Date is required" }}
              render={({ field }) => (
                <FloatingDatePicker
                  id="emi_due_date"
                  name="due_date"
                  label="Monthly Due Date"
                  required
                  format="DD/MM/YYYY"
                  error={errors.due_date}
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

          {/* Payment Mode */}
          <div data-field-container data-field="payment_mode">
            <FloatingSelect
              id="emi_payment_mode"
              label="Payment Mode"
              options={PAYMENT_MODES}
              error={errors.payment_mode}
              {...register("payment_mode")}
            />
          </div>

          {/* Status */}
          <div data-field-container data-field="status">
            <FloatingSelect
              id="emi_status"
              label="Loan Status"
              options={["Active", "Closed"]}
              error={errors.status}
              {...register("status")}
            />
          </div>
        </div>
      </div>

      {/* 4. Notes & Remarks Section */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shadow-2xs">
            <FiFileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Notes & Remarks
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Record hypothecation status, guarantor details, or special terms
            </p>
          </div>
        </div>

        <div data-field-container data-field="notes">
          <FloatingTextarea
            id="emi_notes"
            label="Notes & Remarks"
            rows={3}
            placeholder="e.g. Hypothecation NOC pending from bank, e-mandate registered with SBI account..."
            error={errors.notes}
            {...register("notes")}
          />
        </div>
      </div>

      {/* 5. Live Calculations Ribbon */}
      {emiAmt > 0 && tenure > 0 && (
        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
              <FiTrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Calculated Financial Overview
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-blue-100/80 shadow-2xs">
              <span className="text-slate-500 block text-[11px] font-medium">
                Total Repayment
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
                ₹{totalPayable.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-blue-100/80 shadow-2xs">
              <span className="text-slate-500 block text-[11px] font-medium">
                Total Interest
              </span>
              <span className="font-bold text-amber-700 text-xs sm:text-sm mt-0.5 block">
                ₹{totalInterest.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-blue-100/80 shadow-2xs">
              <span className="text-slate-500 block text-[11px] font-medium">
                Pending Balance
              </span>
              <span className="font-bold text-blue-700 text-xs sm:text-sm mt-0.5 block">
                ₹{remainingOutflow.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-blue-100/80 shadow-2xs">
              <span className="text-slate-500 block text-[11px] font-medium">
                Maturity Date
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
                {estimatedEndDate || "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Form Footer Action Buttons */}
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
              <span>Saving Record...</span>
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{isEdit ? "Update EMI Record" : "Save EMI Record"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
