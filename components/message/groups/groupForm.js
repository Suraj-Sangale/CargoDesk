"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiUsers, FiPlus, FiCheck } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { postApiData } from "@/utilities/services/apiService";
import { getConstant } from "@/utilities/utils";
import GroupMemberSelection from "./groupMemberSelection";
import { showToast } from "@/utilities/toastService";
import {
  FloatingInput,
  FloatingTextarea,
} from "@/components/common/floatingInput";

export default function GroupForm({
  pageData,
  modalData,
  isEdit = false,
  setGroupModal,
  setGroupsList,
  contactsList = [],
}) {
  const defaultFormData = { groupName: "", description: "", contactIds: [] };
  const initialFormData = isEdit ? modalData : defaultFormData;
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm();

  const validations = {
    groupName: {
      required: "Group Name is required",
      maxLength: { value: 50, message: "Group Name too long (max 50 chars)" },
    },
    description: {
      maxLength: {
        value: getConstant("LEN_MAX_NOTE") || 200,
        message: `Max ${getConstant("LEN_MAX_NOTE") || 200} characters`,
      },
    },
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) clearErrors(field);
  };

  const handleCreateGroup = async () => {
    const addNewPayload = {
      userId: pageData?.user?.userId,
      groupName: formData.groupName,
      description: formData.description,
      contactIds: formData.contactIds,
    };

    try {
      const response = await postApiData(
        "CREATE_NEW_GROUP_OF_CONTACTS",
        addNewPayload
      );

      if (response.status) {
        showToast({
          message: response.message || "Group created successfully!",
          type: "success",
        });
        reset();
        setFormData(defaultFormData);

        if (setGroupsList) {
          setGroupsList((prev) => [
            ...prev,
            { ...addNewPayload, id: response.id || Date.now() },
          ]);
        }
      } else {
        showToast({
          message: response.message || "Failed to create group",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Create group error:", error);
      showToast({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    const idsToAdd = formData.contactIds.filter(
      (id) => !(modalData?.contactIds || []).includes(id)
    );
    const idsToRemove = (modalData?.contactIds || []).filter(
      (id) => !formData.contactIds.includes(id)
    );

    const updatePayload = {
      groupId: modalData.id,
      userId: pageData?.user?.userId,
      groupName: formData.groupName,
      description: formData.description,
      idsToAdd,
      idsToRemove,
    };

    try {
      const response = await postApiData(
        "UPDATE_USERS_GROUP_DETAILS",
        updatePayload
      );

      if (response.status) {
        showToast({
          message: response.message || "Group updated successfully!",
          type: "success",
        });
        reset();
        setFormData(defaultFormData);

        if (setGroupsList) {
          setGroupsList((prev) =>
            prev.map((g) =>
              g.id === modalData.id
                ? { ...g, ...updatePayload, contactIds: formData.contactIds }
                : g
            )
          );
        }
        if (setGroupModal) setGroupModal(false);
      } else {
        showToast({
          message: response.message || "Failed to update group",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Update group error:", error);
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
      handleUpdateGroup();
    } else {
      handleCreateGroup();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`w-full space-y-4 ${
        !isEdit
          ? "rounded-2xl p-6 bg-white border border-slate-200/80 shadow-2xs"
          : "px-4 sm:px-6 py-4 bg-slate-50"
      }`}
    >
      {/* Header if not in modal */}
      {!isEdit && (
        <div className="flex items-center gap-3.5 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] border border-purple-100 text-[#9333EA] flex items-center justify-center shrink-0 shadow-2xs">
            <FiUsers className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Create Contact Group
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Group contacts together for one-click broadcast messages.
            </p>
          </div>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Group Name */}
        <div data-field-container data-field="groupName">
          <FloatingInput
            id="group_name"
            label="Group Name"
            required
            value={formData.groupName}
            placeholder="e.g. Mumbai Drivers, Dispatch Team"
            error={errors.groupName}
            {...register("groupName", validations.groupName)}
            onChange={(e) => handleChange("groupName", e.target.value)}
          />
        </div>

        {/* Group Description */}
        <div data-field-container data-field="description">
          <FloatingInput
            id="group_description"
            label="Group Description (Optional)"
            value={formData.description}
            placeholder="Brief note about this group"
            error={errors.description}
            {...register("description", validations.description)}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>

      {/* Member Selection Section */}
      <GroupMemberSelection
        contactsList={contactsList}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Action Footer */}
      {isEdit ? (
        <div className="pt-2 flex items-center justify-end gap-2">
          {setGroupModal && (
            <button
              type="button"
              onClick={() => setGroupModal(false)}
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
                <span>Updating Group...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Update Group</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <ImSpinner9 className="w-4 h-4 animate-spin" />
              <span>Creating Group...</span>
            </>
          ) : (
            <>
              <FiPlus className="w-4 h-4" />
              <span>Create Group</span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
