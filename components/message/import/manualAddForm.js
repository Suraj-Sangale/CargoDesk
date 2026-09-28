"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiUser, FiPlus, FiCheck } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { getConstant } from "@/utilities/utils";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import {
  FloatingInput,
  FloatingTextarea,
} from "@/components/common/floatingInput";

export default function ManualAddForm({
  pageData,
  modalData,
  isEdit = false,
  setContactModal,
  setContactsList,
}) {
  const defaultFormData = { name: "", phone: "", note: "" };
  const initialFormData = isEdit ? modalData : defaultFormData;
  const [formData, setFormData] = useState(initialFormData);

  const [validations, setValidations] = useState({});
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm();

  // Set up validations on mount
  useEffect(() => {
    setValidations({
      name: {
        required: "Name is required",
        maxLength: { value: 50, message: "Name too long (max 50 chars)" },
      },
      phone: {
        required: "Phone number is required",
        minLength: {
          value: getConstant("LEN_MIN_PHONE_NO") || 10,
          message: "Phone number is too short",
        },
        maxLength: {
          value: getConstant("LEN_MAX_PHONE_NO") || 15,
          message: "Phone number is too long",
        },
        pattern: {
          value: /^[+]?[0-9]{7,15}$/,
          message: "Please enter a valid phone number",
        },
      },
      note: {
        maxLength: {
          value: getConstant("LEN_MAX_NOTE") || 250,
          message: `Max ${getConstant("LEN_MAX_NOTE") || 250} characters`,
        },
      },
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) clearErrors(field);
  };

  const addNewContact = async () => {
    try {
      const payload = {
        userId: pageData?.user?.userId,
        name: formData.name,
        contactNo: formData.phone,
        note: formData.note,
      };

      const response = await postApiData("ADD_NEW_CONTACT", payload);
      if (response.status) {
        showToast({
          message: response.message || "Contact added successfully!",
          type: "success",
        });
        if (setContactsList) {
          setContactsList((prev) => [...prev, { ...payload, id: response.id || Date.now() }]);
        }
        reset();
        setFormData(defaultFormData);
        if (setContactModal) setContactModal(false);
      } else {
        showToast({
          message: response.message || "Failed to add contact",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const editContact = async () => {
    try {
      const editPayload = {
        id: modalData.id,
        data: {
          name: formData.name,
          contactNo: formData.phone,
          note: formData.note,
        },
      };

      const response = await postApiData("UPDATE_CONTACT", editPayload);
      if (response.status) {
        showToast({
          message: response.message || "Contact updated successfully!",
          type: "success",
        });

        reset();
        setFormData(defaultFormData);
        if (setContactModal) setContactModal(false);
        if (setContactsList) {
          setContactsList((prev) =>
            prev.map((c) =>
              c.id === editPayload.id ? { ...c, ...editPayload.data } : c
            )
          );
        }
      } else {
        showToast({
          message: response.message || "Failed to update contact",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    setLoading(true);
    if (isEdit) {
      editContact();
    } else {
      addNewContact();
    }
  };

  return (
    <form
      className={`w-full space-y-4 ${
        !isEdit
          ? "rounded-2xl p-6 bg-white border border-slate-200/80 shadow-2xs"
          : "px-4 sm:px-6 py-4 bg-slate-50"
      }`}
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* Header if not in modal */}
      {!isEdit && (
        <div className="flex items-center gap-3.5 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
            <FiUser className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Add Contact Manually
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enter the contact details below to add a new contact.
            </p>
          </div>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Field */}
        <div data-field-container data-field="name">
          <FloatingInput
            id="contact_name"
            label="Name"
            required
            placeholder="Enter Name"
            value={formData.name}
            error={errors.name}
            {...register("name", validations.name)}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        {/* Phone Number Field */}
        <div data-field-container data-field="phone">
          <FloatingInput
            id="contact_phone"
            label="Phone Number"
            required
            type="tel"
            placeholder="Enter Phone No"
            value={formData.phone}
            minLength={getConstant("LEN_MIN_PHONE_NO") || 10}
            maxLength={getConstant("LEN_MAX_PHONE_NO") || 15}
            error={errors.phone}
            {...register("phone", validations.phone)}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Note Field */}
      <div data-field-container data-field="note">
        <FloatingTextarea
          id="contact_note"
          label="Note (Optional)"
          rows={3}
          placeholder="Enter Note"
          value={formData.note}
          error={errors.note}
          {...register("note", validations.note)}
          onChange={(e) => handleChange("note", e.target.value)}
        />
      </div>

      {/* Action Footer */}
      {isEdit ? (
        <div className="pt-2 flex items-center justify-end gap-2">
          {setContactModal && (
            <button
              type="button"
              onClick={() => setContactModal(false)}
              disabled={loading}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/25 hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ImSpinner9 className="w-4 h-4 animate-spin" />
                <span>Updating Contact...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Update Contact</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <ImSpinner9 className="w-4 h-4 animate-spin" />
              <span>Adding Contact...</span>
            </>
          ) : (
            <>
              <FiPlus className="w-4 h-4" />
              <span>Add Contact</span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
