"use client";

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import moment from "moment";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { vehicleNoListArr } from "@/utilities/dummyData";
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

export default function EmiForm({ setEmiList, modalData, isEdit, onClose, toggleModal }) {
  const defaultFormData = {
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

  const [apiLoading, setApiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultFormData,
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

  // Populate data when editing
  useEffect(() => {
    if (isEdit && modalData) {
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
    }
  }, [isEdit, modalData, reset]);

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

      reset(defaultFormData);
      handleClose();
    } else {
      showToast(response?.message || "Failed to save EMI record", "error");
    }

    setApiLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-5 md:p-6 space-y-6 max-h-[82vh] overflow-y-auto"
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
          {/* Vehicle Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Vehicle Number{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              list="vehicleSuggestionsList"
              placeholder="e.g. MH 04 EF 9101"
              {...register("vehicle_number", {
                onChange: (e) =>
                  setValue("vehicle_number", e.target.value.toUpperCase()),
              })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs uppercase placeholder:normal-case font-medium"
            />
            <datalist id="vehicleSuggestionsList">
              {vehicleNoListArr.map((item) => (
                <option key={item.id} value={item.label} />
              ))}
            </datalist>
          </div>

          {/* Loan / Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loan / Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Truck Chassis Loan, Vehicle EMI"
              {...register("loan_name", { required: "Loan Name is required" })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.loan_name
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-medium placeholder-slate-400`}
            />
            {errors.loan_name && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.loan_name.message}
              </p>
            )}
          </div>

          {/* Financier / Bank Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Financier / Bank Name
            </label>
            <input
              type="text"
              list="bankOptionsList"
              placeholder="e.g. HDFC Bank, Tata Capital, Cholamandalam"
              {...register("bank_name")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
            />
            <datalist id="bankOptionsList">
              {FINANCIER_OPTIONS.map((bank) => (
                <option key={bank} value={bank} />
              ))}
            </datalist>
          </div>

          {/* Loan Agreement / Account Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loan Agreement / A/C No.
            </label>
            <input
              type="text"
              placeholder="e.g. LN-9842109"
              {...register("loan_account_no")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-mono font-medium placeholder-slate-400"
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loan Principal Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1500000"
              {...register("loan_amount", {
                required: "Loan Amount is required",
                min: { value: 1, message: "Must be greater than 0" },
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.loan_amount
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-semibold placeholder-slate-400`}
            />
            {errors.loan_amount && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.loan_amount.message}
              </p>
            )}
          </div>

          {/* Monthly EMI Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Monthly EMI Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 42500"
              {...register("emi_amount", {
                required: "EMI Amount is required",
                min: { value: 1, message: "Must be greater than 0" },
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-blue-600 rounded-xl border ${
                errors.emi_amount
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-bold placeholder-slate-400`}
            />
            {errors.emi_amount && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.emi_amount.message}
              </p>
            )}
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Down Payment Paid (₹){" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 250000"
              {...register("down_payment")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Interest Rate (% p.a.){" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 9.5"
              {...register("interest_rate")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
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
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Total Tenure (Months) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 36"
              {...register("tenure_months", {
                required: "Tenure is required",
                min: { value: 1, message: "Must be at least 1 month" },
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.tenure_months
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-medium placeholder-slate-400`}
            />
            {errors.tenure_months && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.tenure_months.message}
              </p>
            )}
          </div>

          {/* EMIs Paid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              EMIs Paid So Far (Installments)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 12"
              {...register("emis_paid")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loan Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register("start_date", {
                required: "Start Date is required",
              })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.start_date
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-medium`}
            />
            {errors.start_date && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.start_date.message}
              </p>
            )}
          </div>

          {/* Monthly Due Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Monthly Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register("due_date", { required: "Due Date is required" })}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border ${
                errors.due_date
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/15"
              } outline-none focus:ring-2 transition-all shadow-2xs font-medium`}
            />
            {errors.due_date && (
              <p className="text-rose-500 text-xs font-medium mt-1">
                {errors.due_date.message}
              </p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Mode
            </label>
            <select
              {...register("payment_mode")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Loan Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
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

        <div>
          <textarea
            rows={2}
            placeholder="e.g. Hypothecation NOC pending from bank, e-mandate registered with SBI account..."
            {...register("notes")}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs font-medium placeholder-slate-400 resize-none"
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
