"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import moment from "moment";
import {
  FloatingInput,
  FloatingTextarea,
  FloatingSelect,
  FloatingDatePicker,
} from "../floatingInput";
import { reminderValidation } from "@/utilities/formValidation";
import useAutoFocusField from "@/hooks/useAutoFocusField";
import { FiCheck } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const DEFAULT_REMINDER_DATA = {
  title: "",
  description: "",
  date: moment().format("YYYY-MM-DD"),
  priority: "medium",
};

export default function AddReminderForm({
  setReminderModal,
  reminderData,
  isEdit,
  focusField,
  addReminderData,
  updateReminderData,
  isLoading,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_REMINDER_DATA,
  });

  useEffect(() => {
    if (isEdit && reminderData) {
      reset({
        title: reminderData.title || "",
        description: reminderData.description || "",
        date: reminderData.date
          ? moment(reminderData.date).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        priority: reminderData.priority || "medium",
      });
    } else {
      reset(DEFAULT_REMINDER_DATA);
    }
  }, [isEdit, reminderData, reset]);

  // Platform-wide auto-scroll and highlight target field
  useAutoFocusField(focusField, Boolean(focusField), [reminderData, isEdit]);

  const onSubmit = (data) => {
    const formattedDate = data.date
      ? moment(data.date).toISOString()
      : moment().toISOString();

    const payload = {
      ...reminderData,
      title: data.title ? data.title.trim() : "",
      description: data.description ? data.description.trim() : "",
      date: formattedDate,
      priority: data.priority || "medium",
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
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 sm:px-6 py-4 space-y-4 bg-slate-50">
      {/* Title Field */}
      <div data-field-container data-field="title">
        <FloatingInput
          id="reminder_title"
          label="Reminder Title"
          required
          placeholder="Enter title..."
          error={errors?.title}
          {...register("title", reminderValidation.title || { required: "Title is required" })}
        />
      </div>

      {/* Description Field */}
      <div data-field-container data-field="description">
        <FloatingTextarea
          id="reminder_description"
          label="Description (Optional)"
          placeholder="Enter description..."
          rows={3}
          error={errors?.description}
          {...register("description", reminderValidation.description)}
        />
      </div>

      {/* Date Field using FloatingDatePicker */}
      <div data-field-container data-field="date">
        <Controller
          name="date"
          control={control}
          rules={reminderValidation.date || { required: "Please select a date" }}
          render={({ field }) => (
            <FloatingDatePicker
              id="reminder_date"
              name="date"
              label="Reminder Date"
              required
              format="DD/MM/YYYY"
              error={errors?.date}
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

      {/* Priority Select */}
      <div data-field-container data-field="priority">
        <FloatingSelect
          id="reminder_priority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          error={errors?.priority}
          {...register("priority", reminderValidation.priority)}
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
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{isEdit ? "Update Reminder" : "Add Reminder"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
