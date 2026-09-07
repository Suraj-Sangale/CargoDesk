import React, { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { postApiData } from "@/utilities/services/apiService";
import PrevMessageCard from "./prevMessageCard";
import MessagePageHeader from "./messagePageHeader";
import { showToast } from "@/utilities/toastService";
import {
  FiSearch,
  FiPlus,
  FiFileText,
  FiUser,
  FiUsers,
  FiSmile,
  FiPaperclip,
  FiRefreshCw,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
} from "react-icons/fi";
import { RiSendPlaneFill } from "react-icons/ri";
import { ImSpinner9 } from "react-icons/im";
import { scrollSectionIntoView } from "@/utilities/utils";

export default function MessageWrapper({
  pageData,
  contacts = [],
  groups = [],
  savedTemplates = [],
}) {
  const [contactsList] = useState(contacts);
  const [groupsList] = useState(groups);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const [formData, setFormData] = useState({
    message: "",
    contacts: [],
    groups: [],
  });

  const [loading, setLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);
  const [sendSummary, setSendSummary] = useState(null);
  const [contactsError, setContactsError] = useState(false);
  const [selectedTab, setSelectedTab] = useState("contacts");
  const [copied, setCopied] = useState(false);
  const [sendMsgApiError, setSendMsgApiError] = useState("");
  const [showAddMsgTemplet, setShowAddMsgTemplet] = useState(false);
  const [savedMsgTemplets, setSavedMsgTemplets] = useState(savedTemplates);
  const [newTemplateText, setNewTemplateText] = useState("");
  const [addMsgLoading, setAddMsgLoading] = useState(false);
  const [deleteMsgLoading, setDeleteMsgLoading] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);

  // Search states
  const [templateSearch, setTemplateSearch] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  // Mobile collapsed state for Saved Templates (< 1024px)
  const [isTemplatesExpandedMobile, setIsTemplatesExpandedMobile] = useState(false);

  // Emoji & Variable dropdown toggles
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVariableDropdown, setShowVariableDropdown] = useState(false);
  const emojiRef = useRef(null);
  const varRef = useRef(null);

  const quickEmojis = [
    "👋",
    "🚚",
    "📦",
    "✅",
    "⚠️",
    "📄",
    "🔔",
    "🙏",
    "⏳",
    "🚀",
  ];
  const quickVariables = [
    { label: "Contact Name", value: "{name}" },
    { label: "Vehicle Number", value: "{vehicleNo}" },
    { label: "Date", value: "{date}" },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (varRef.current && !varRef.current.contains(e.target)) {
        setShowVariableDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    register("message", {
      required: "Please enter a message",
      maxLength: {
        value: 1000,
        message: "Message cannot exceed 1000 characters",
      },
    });
  }, [register]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValue(field, value, { shouldValidate: true });

    if (field === "contacts" && value.length > 0) {
      setContactsError(false);
    }
  };

  const handleCheckboxChange = (contact) => {
    setContactsError(false);
    setFormData((prev) => {
      const exists = prev.contacts.find((c) => c.id === contact.id);
      if (exists) {
        return {
          ...prev,
          contacts: prev.contacts.filter((c) => c.id !== contact.id),
        };
      } else {
        return {
          ...prev,
          contacts: [...prev.contacts, contact],
        };
      }
    });
  };

  const handleGroupClick = (group) => {
    setContactsError(false);
    setFormData((prev) => {
      const exists = prev.groups.find((g) => g.id === group.id);
      if (exists) {
        return {
          ...prev,
          groups: prev.groups.filter((g) => g.id !== group.id),
        };
      } else {
        return {
          ...prev,
          groups: [...prev.groups, group],
        };
      }
    });
  };

  const handleClearAllRecipients = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [],
      groups: [],
    }));
    setContactsError(false);
  };

  const handleClearMessage = () => {
    handleChange("message", "");
  };

  const insertTextAtMessage = (text) => {
    const current = formData.message || "";
    handleChange("message", current + (current ? " " : "") + text);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateText.trim()) return;
    setAddMsgLoading(true);

    const newTemplate = {
      userId: pageData?.user?.userId,
      message: newTemplateText.trim(),
    };

    try {
      const response = await postApiData("ADD_MSG_TEMPLATE", newTemplate);
      if (response.status) {
        setNewTemplateText("");
        setShowAddMsgTemplet(false);
        setSavedMsgTemplets((prev) => [
          { ...newTemplate, id: response.templateId },
          ...prev,
        ]);
        showToast({
          message: response.message || "Template saved successfully",
          type: "success",
        });
      } else {
        showToast({
          message: response.message || "Failed to save template",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showToast({
        message: "Error occurred while saving template",
        type: "error",
      });
    }
    setAddMsgLoading(false);
  };

  const handleCopy = (item) => {
    navigator.clipboard.writeText(item.message);
    setCopied(item.id);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDelete = async (msg) => {
    setToDelete(msg);
    const payload = { id: pageData?.user?.userId, msgId: msg.id };
    setDeleteMsgLoading(true);

    try {
      const response = await postApiData("DELETE_MSG_TEMPLATE", payload);
      if (response.status) {
        setSavedMsgTemplets((prev) => prev.filter((m) => m.id !== msg.id));
        setIsConfirm(false);
        showToast({
          message: response.message || "Template deleted successfully",
          type: "success",
        });
      } else {
        showToast({
          message: response.message || "Failed to delete template",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Delete template failed", err);
    }
    setDeleteMsgLoading(false);
    setToDelete(false);
  };

  const CLIENT_BATCH_SIZE = 50; // Configurable client-side batch size for chunked sending

  const onSubmit = async () => {
    if (formData.contacts.length === 0 && formData.groups.length === 0) {
      setContactsError(true);
      scrollSectionIntoView("select-recipients");
      showToast({
        message: "Please select at least one contact or group.",
        type: "error",
      });
      return;
    }

    // Collect all phone numbers from selected individual contacts and groups
    const rawContactNumbers = [
      ...formData.contacts.map((c) => c.contactNo),
      ...formData.groups.flatMap((group) =>
        (group.contactIds || []).map((id) => {
          const match = contactsList.find((c) => c.id === id);
          return match ? match.contactNo : null;
        }),
      ),
    ].filter(Boolean);

    // Deduplicate and trim numbers
    const uniqueNumbers = Array.from(
      new Set(
        rawContactNumbers
          .map((num) =>
            typeof num === "string" ? num.trim() : String(num).trim(),
          )
          .filter(Boolean),
      ),
    );

    if (uniqueNumbers.length === 0) {
      showToast({
        message: "No valid contacts or phone numbers found in selection.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setSendMsgApiError("");
    setSendSummary(null);

    const totalRecipients = uniqueNumbers.length;
    setSendProgress({ current: 0, total: totalRecipients, percent: 0 });

    let overallSentCount = 0;
    let overallFailedCount = 0;
    let overallInvalidNumbers = [];
    let overallFailedDetails = [];

    try {
      // Chunk recipients into manageable batches to prevent HTTP timeouts & overload
      for (let i = 0; i < totalRecipients; i += CLIENT_BATCH_SIZE) {
        const batch = uniqueNumbers.slice(i, i + CLIENT_BATCH_SIZE);
        const processedCount = Math.min(i + batch.length, totalRecipients);

        setSendProgress({
          current: processedCount,
          total: totalRecipients,
          percent: Math.round((processedCount / totalRecipients) * 100),
        });

        const payload = {
          message: formData.message,
          contacts: batch,
        };

        const response = await postApiData("SEND_MESSAGE", payload);

        if (response && response.data) {
          overallSentCount += response.data.sentCount || 0;
          overallFailedCount += response.data.failedCount || 0;
          if (Array.isArray(response.data.invalidNumbers)) {
            overallInvalidNumbers.push(...response.data.invalidNumbers);
          }
          if (Array.isArray(response.data.failed)) {
            overallFailedDetails.push(...response.data.failed);
          }
        } else if (response && response.status) {
          overallSentCount += batch.length;
        } else {
          overallFailedCount += batch.length;
          overallFailedDetails.push({
            error: response?.message || "Batch request failed",
            batch,
          });
        }
      }

      // Aggregate final campaign statistics
      const summary = {
        total: totalRecipients,
        sentCount: overallSentCount,
        failedCount: overallFailedCount,
        invalidCount: overallInvalidNumbers.length,
        failedDetails: overallFailedDetails,
        invalidNumbers: overallInvalidNumbers,
      };

      setSendSummary(summary);

      if (
        overallSentCount === totalRecipients &&
        overallInvalidNumbers.length === 0
      ) {
        showToast({
          message: `Message sent successfully to all ${overallSentCount} recipient${overallSentCount > 1 ? "s" : ""}!`,
          type: "success",
        });
      } else if (overallSentCount > 0) {
        showToast({
          message: `Sent to ${overallSentCount} of ${totalRecipients} recipient${totalRecipients > 1 ? "s" : ""}.${overallFailedCount > 0 ? ` ${overallFailedCount} failed.` : ""}`,
          type: "success",
        });
      } else {
        const errorMsg =
          overallFailedDetails[0]?.error ||
          "Failed to send messages. Please check your SMS configuration.";
        setSendMsgApiError(errorMsg);
        showToast({
          message: errorMsg,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Message sending failed:", err);
      setSendMsgApiError(
        err?.message || "An error occurred while sending the message.",
      );
      showToast({
        message: "An error occurred while sending the message.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setSendProgress(null);
    }
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return savedMsgTemplets || [];
    const q = templateSearch.toLowerCase().trim();
    return (savedMsgTemplets || []).filter((item) =>
      (item.message || "").toLowerCase().includes(q),
    );
  }, [savedMsgTemplets, templateSearch]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    if (!recipientSearch.trim()) return contactsList || [];
    const q = recipientSearch.toLowerCase().trim();
    return (contactsList || []).filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.contactNo || "").includes(q),
    );
  }, [contactsList, recipientSearch]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    if (!recipientSearch.trim()) return groupsList || [];
    const q = recipientSearch.toLowerCase().trim();
    return (groupsList || []).filter((g) =>
      (g.groupName || "").toLowerCase().includes(q),
    );
  }, [groupsList, recipientSearch]);

  const totalSelectedCount = formData.contacts.length + formData.groups.length;

  return (
    <div className="w-full">
      {/* Page Header */}
      <MessagePageHeader
        eyebrow="MESSENGER"
        title="Send a Message"
        subtitle="Type a new message or use a saved template to quickly communicate with your contacts or groups."
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Main 2-Column Responsive Layout matching reference */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT COLUMN: Message Composer + Saved Templates (~68%) */}
          <div className="flex-1 w-full space-y-6">
            {/* 1. Message Composer Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-4">
              {/* Card Title */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Message
                </h2>
              </div>

              {/* Textarea Box with Blue Border */}
              <div
                className="relative rounded-2xl border border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white p-4 transition-all"
                id="messageInput"
              >
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none resize-none pr-14"
                />

                {/* Top-Right: Smile & Attachment icons */}
                <div className="absolute right-4 top-4 flex items-center gap-2 text-slate-500">
                  <div className="relative" ref={emojiRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-slate-400 hover:text-amber-500 transition-colors p-1 cursor-pointer"
                      title="Emoji"
                    >
                      <FiSmile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute right-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-5 gap-1.5 z-30 animate-dropdown">
                        {quickEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              insertTextAtMessage(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast({
                        message: "Attachment feature ready",
                        type: "success",
                      });
                    }}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                    title="Attach File"
                  >
                    <FiPaperclip className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom-Right: Character Counter 0/1000 */}
                <div className="absolute right-4 bottom-3 text-xs text-slate-400 font-medium">
                  {formData.message.length}/1000
                </div>
              </div>

              {errors.message && (
                <p className="text-xs text-rose-500 font-medium">
                  {errors.message.message}
                </p>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Left Buttons: Insert Template, Variables, Clear */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Insert Template Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const elem = document.getElementById(
                        "saved-templates-card",
                      );
                      if (elem) {
                        elem.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBF5FF] text-[#2563EB] hover:bg-blue-100 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer border border-blue-100"
                  >
                    <FiFileText className="w-4 h-4" />
                    <span>Insert Template</span>
                  </button>

                  {/* Variables Button */}
                  <div className="relative" ref={varRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setShowVariableDropdown(!showVariableDropdown)
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBF5FF] text-[#2563EB] hover:bg-blue-100 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer border border-blue-100"
                    >
                      <span className="font-mono font-bold text-xs">{`{}`}</span>
                      <span>Variables</span>
                    </button>

                    {showVariableDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-dropdown">
                        <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Insert Variable
                        </div>
                        {quickVariables.map((v) => (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => {
                              insertTextAtMessage(v.value);
                              setShowVariableDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                          >
                            <span>{v.label}</span>
                            <span className="text-[11px] text-blue-600 font-semibold font-mono">
                              {v.value}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear Button */}
                  <button
                    type="button"
                    onClick={handleClearMessage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer border border-slate-200/60"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Right Button: Send Message */}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <ImSpinner9 className="w-4 h-4 animate-spin" />
                      <span>
                        {sendProgress
                          ? `Sending (${sendProgress.current}/${sendProgress.total})...`
                          : "Sending..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <RiSendPlaneFill className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar (Visible during batch transmission) */}
              {loading && sendProgress && (
                <div className="pt-2 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                      <ImSpinner9 className="w-3 h-3 animate-spin" />
                      <span>Transmitting batch to recipients...</span>
                    </span>
                    <span>
                      {sendProgress.current} of {sendProgress.total} (
                      {sendProgress.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div
                      className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${sendProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Report Summary Banner */}
              {sendSummary && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 animate-fade-in transition-all ${
                    sendSummary.failedCount === 0 &&
                    sendSummary.invalidCount === 0
                      ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                      : sendSummary.sentCount > 0
                        ? "bg-amber-50/90 border-amber-200 text-amber-950"
                        : "bg-rose-50/90 border-rose-200 text-rose-950"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="flex items-center gap-1.5">
                      {sendSummary.sentCount > 0
                        ? "Campaign Summary Report"
                        : "Message Transmission Failed"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSendSummary(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Dismiss report"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-black/5 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total
                      </span>
                      <span className="font-extrabold text-base text-slate-900">
                        {sendSummary.total}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                        Sent
                      </span>
                      <span className="font-extrabold text-base text-emerald-700">
                        {sendSummary.sentCount}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-rose-500 block">
                        Failed
                      </span>
                      <span className="font-extrabold text-base text-rose-700">
                        {sendSummary.failedCount}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">
                        Invalid
                      </span>
                      <span className="font-extrabold text-base text-amber-700">
                        {sendSummary.invalidCount}
                      </span>
                    </div>
                  </div>

                  {sendSummary.failedDetails &&
                    sendSummary.failedDetails.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-600 border-t border-black/5">
                        <span className="font-semibold text-rose-700">
                          Error Details:{" "}
                        </span>
                        {sendSummary.failedDetails.slice(0, 3).map((f, i) => (
                          <span key={i} className="block truncate">
                            • {f.to ? `${f.to}: ` : ""}
                            {f.error}
                          </span>
                        ))}
                        {sendSummary.failedDetails.length > 3 && (
                          <span className="text-slate-400 italic">
                            +{sendSummary.failedDetails.length - 3} more errors
                          </span>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* 2. Saved Templates Section */}

            {/* A. Mobile Collapsed Card (< 1024px, when not expanded) */}
            {!isTemplatesExpandedMobile && (
              <div className="lg:hidden bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all hover:border-blue-200">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTemplatesExpandedMobile(true)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-100/70 transition-colors">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Saved Templates
                        </h3>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {filteredTemplates.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        Tap to view &amp; use predefined templates
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplatesExpandedMobile(true);
                        setShowAddMsgTemplet(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      title="Add New Template"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTemplatesExpandedMobile(true)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-blue-100"
                    >
                      <span>Expand</span>
                      <FiChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* B. Full Saved Templates Card (Always shown on >= 1024px / lg, shown when expanded on < 1024px) */}
            <div
              id="saved-templates-card"
              className={`${
                isTemplatesExpandedMobile ? "block" : "hidden lg:block"
              } bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-5 animate-fade-in`}
            >
              {/* Header Row: Title & Subtitle on Left, Search & + Add New on Right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Saved Templates
                      </h2>
                      <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        {filteredTemplates.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Use predefined templates to send messages quickly.
                    </p>
                  </div>

                  {/* Collapse Button on Mobile (< 1024px) */}
                  <button
                    type="button"
                    onClick={() => setIsTemplatesExpandedMobile(false)}
                    className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    title="Collapse Templates"
                  >
                    <FiChevronUp className="w-4 h-4" />
                    <span>Collapse</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search input */}
                  {!showAddMsgTemplet && (
                    <div className="relative w-44 sm:w-56">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 outline-none transition-all"
                      />
                      {templateSearch && (
                        <button
                          type="button"
                          onClick={() => setTemplateSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* + Add New Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddMsgTemplet(!showAddMsgTemplet)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1E62] hover:bg-blue-900 text-white rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    {showAddMsgTemplet ? (
                      <>
                        <FiX className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <FiPlus className="w-3.5 h-3.5" />
                        <span>Add New</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Inline Add Template Form */}
              {showAddMsgTemplet ? (
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3 animate-slide-down">
                  <span className="text-xs font-bold text-slate-800">
                    Create New Template
                  </span>
                  <textarea
                    rows={3}
                    className="w-full p-3 text-xs md:text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 resize-none"
                    placeholder="Type your message to save as a template..."
                    value={newTemplateText}
                    onChange={(e) => setNewTemplateText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMsgTemplet(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={!newTemplateText.trim() || addMsgLoading}
                      className="px-4 py-1.5 text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {addMsgLoading ? (
                        <>
                          <ImSpinner9 className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        "Save Template"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* 2-Column Templates Grid */
                <>
                  {filteredTemplates.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <FiFileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {templateSearch
                            ? "No matching templates found"
                            : "No saved templates yet"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {templateSearch
                            ? "Try another search keyword"
                            : "Create a template to quickly send recurring messages."}
                        </p>
                      </div>
                      {!templateSearch && (
                        <button
                          type="button"
                          onClick={() => setShowAddMsgTemplet(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Add New Template</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredTemplates.map((item, i) => (
                        <PrevMessageCard
                          key={item.id || i}
                          index={i}
                          item={item}
                          handleChange={handleChange}
                          copied={copied}
                          handleCopy={handleCopy}
                          handleDelete={handleDelete}
                          deleteMsgLoading={deleteMsgLoading}
                          toDelete={toDelete}
                          setIsConfirm={setIsConfirm}
                          isConfirm={isConfirm}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Select Recipients Card (~32%) */}
          <div
            className="w-full lg:w-96 shrink-0 space-y-4"
            id="select-recipients"
          >
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-4 flex flex-col">
              {/* Header: Title on Left, Manage Contacts Link Button on Right */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Select Recipients
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Choose contacts or groups to send your message.
                  </p>
                </div>

                <Link
                  href="/messager/manage-contacts"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EBF5FF] hover:bg-blue-100 hover:text-blue-800 border border-blue-200/70 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs"
                  title="Manage Contacts & Groups"
                >
                  <FiUsers className="w-3.5 h-3.5" />
                  <span>Manage</span>
                  <FiExternalLink className="w-3 h-3 opacity-70" />
                </Link>
              </div>

              {/* Segmented Pill Tabs: Contacts vs Groups */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSelectedTab("contacts")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTab === "contacts"
                      ? "bg-[#1D4ED8] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Contacts ({contactsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTab("groups")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTab === "groups"
                      ? "bg-[#1D4ED8] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Groups ({groupsList.length})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder={
                    selectedTab === "contacts"
                      ? "Search contacts..."
                      : "Search groups..."
                  }
                  className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 outline-none transition-all"
                />
                {recipientSearch && (
                  <button
                    type="button"
                    onClick={() => setRecipientSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Recipient List */}
              <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                {selectedTab === "contacts" ? (
                  <>
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => {
                        const isSelected = !!formData.contacts.find(
                          (c) => c.id === contact.id,
                        );
                        const initial = (contact.name || "C")
                          .charAt(0)
                          .toUpperCase();

                        return (
                          <label
                            key={contact.id}
                            className={`flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all cursor-pointer border-b border-slate-100/80 ${
                              isSelected
                                ? "bg-blue-50/80"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(contact)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                            />

                            {/* Circular Pastel Blue Avatar */}
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#EBF5FF] text-[#2563EB]">
                              {initial}
                            </div>

                            {/* Contact Name */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold text-slate-900 truncate"
                                title={contact.name}
                              >
                                {contact.name}
                              </p>
                            </div>

                            {/* Phone Number */}
                            <span className="text-xs font-mono text-slate-500 shrink-0">
                              {contact.contactNo}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <FiUser className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No contacts found.</p>
                        <Link
                          href="/messager/manage-contacts?tab=import"
                          className="text-blue-600 underline font-medium mt-1 inline-block"
                        >
                          Add or Import Contacts
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((group) => {
                        const isSelected = !!formData.groups.find(
                          (g) => g.id === group.id,
                        );

                        return (
                          <div
                            key={group.id}
                            onClick={() => handleGroupClick(group)}
                            className={`flex items-center justify-between py-2.5 px-2 rounded-xl transition-all cursor-pointer border-b border-slate-100/80 ${
                              isSelected
                                ? "bg-blue-50/80"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleGroupClick(group)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                              />
                              <div className="w-7 h-7 rounded-full bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center font-bold text-xs shrink-0">
                                <FiUsers className="w-3.5 h-3.5" />
                              </div>
                              <span
                                className="text-sm font-semibold text-slate-900 truncate"
                                title={group.groupName}
                              >
                                {group.groupName}
                              </span>
                            </div>

                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full shrink-0">
                              {(group.contactIds || []).length} members
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No groups found.</p>
                        <Link
                          href="/messager/manage-contacts?tab=createGroup"
                          className="text-blue-600 underline font-medium mt-1 inline-block"
                        >
                          Create a Group
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer: X selected + Clear All + Manage Contacts */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="font-semibold text-blue-600">
                  {totalSelectedCount} selected
                </span>
                <div className="flex items-center gap-3">
                  {totalSelectedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRecipients}
                      className="font-semibold text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                  <Link
                    href="/messager/manage-contacts"
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage Contacts</span>
                    <FiExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Selection Error */}
              {/* {contactsError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                  Please select at least one contact or group.
                </div>
              )} */}

              {sendMsgApiError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                  {sendMsgApiError}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
