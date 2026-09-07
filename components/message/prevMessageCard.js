import { scrollSectionIntoView } from "@/utilities/utils";
import React, { useState, useRef, useEffect } from "react";
import {
  FiCopy,
  FiCheck,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiMoreVertical,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

const pastelThemes = [
  {
    iconBg: "bg-[#EBF5FF] text-[#2563EB] border-blue-100",
    hoverBorder: "hover:border-blue-300",
  },
  {
    iconBg: "bg-[#FAF5FF] text-[#9333EA] border-purple-100",
    hoverBorder: "hover:border-purple-300",
  },
  {
    iconBg: "bg-[#ECFDF5] text-[#059669] border-emerald-100",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    iconBg: "bg-[#FFF7ED] text-[#EA580C] border-orange-100",
    hoverBorder: "hover:border-orange-300",
  },
  {
    iconBg: "bg-[#FFF1F2] text-[#E11D48] border-rose-100",
    hoverBorder: "hover:border-rose-300",
  },
];

export default function PrevMessageCard({
  handleChange,
  item,
  copied,
  handleCopy,
  handleDelete,
  deleteMsgLoading,
  toDelete,
  isConfirm,
  setIsConfirm,
  index = 0,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const theme = pastelThemes[index % pastelThemes.length];
  const isCurrentlyConfirming = Boolean(
    isConfirm && (isConfirm.id == item.id || isConfirm == item.id),
  );
  const isDeletingThis = Boolean(
    deleteMsgLoading &&
    (toDelete == item.id || (toDelete && toDelete.id == item.id)),
  );

  // Extract title (first line or truncated first 20 chars) and body preview
  const firstLine = (item.message || "").split("\n")[0] || "Template";
  const titleDisplay =
    firstLine.length > 24 ? firstLine.substring(0, 24) + "..." : firstLine;
  const bodyDisplay = item.message || "";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUse = () => {
    handleChange("message", item.message);
    scrollSectionIntoView("messageInput");
    if (setIsConfirm) setIsConfirm(false);
  };

  const onConfirmDelete = () => {
    if (setIsConfirm) setIsConfirm(item);
    setMenuOpen(false);
  };

  const cancelDelete = () => {
    if (setIsConfirm) setIsConfirm(false);
  };

  return (
    <div
      onClick={handleUse}
      className={`contact-card group relative overflow-hidden bg-white rounded-2xl p-4 border shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer min-h-[135px] ${
        isCurrentlyConfirming
          ? "confirmContactDelete border-red-600"
          : `border-slate-200/70 ${theme.hoverBorder}`
      }`}
    >
      {/* Delete Confirmation Overlay with expanding red circle background */}
      {isCurrentlyConfirming ? (
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[105px] text-white p-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                <FiTrash2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-white">
                Delete Template?
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium leading-relaxed">
              Are you sure you want to delete this template?
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={cancelDelete}
              disabled={isDeletingThis}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item)}
              disabled={isDeletingThis}
              className="px-4 py-1.5 text-xs font-bold bg-white text-red-600 hover:bg-red-50 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeletingThis ? (
                <>
                  <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Row: Icon + Title + 3-dots */}
          <div className="flex items-start gap-3 mb-2">
            {/* Pastel Icon Box */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.iconBg} shadow-2xs shrink-0`}
            >
              <FiFileText className="w-5 h-5" />
            </div>

            {/* Title & Preview */}
            <div className="flex-1 min-w-0 pr-1">
              <h4
                className="text-sm font-bold text-slate-900 truncate tracking-tight"
                title={firstLine}
              >
                {titleDisplay}
              </h4>
              <p
                className="text-xs text-slate-400 font-medium line-clamp-1 break-words mt-0.5"
                title={bodyDisplay}
              >
                {bodyDisplay}
              </p>
            </div>

            {/* 3-Dots Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Options"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 animate-dropdown text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      e.stopPropagation();

                      handleUse();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <FiPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Use</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      e.stopPropagation();

                      handleCopy(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <FiCopy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Actions [+ Use] [Copy] [Delete] */}
          {/* <div className="flex items-center gap-2 pt-2 border-t border-slate-100/80"> */}
          {/* + Use Button
            <button
              type="button"
              onClick={handleUse}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#ECFDF5] text-[#059669] hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors cursor-pointer"
              title="Use template"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Use</span>
            </button> */}

          {/* Copy Button 
            <button
              type="button"
              onClick={() => handleCopy(item)}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#EBF5FF] text-[#2563EB] hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors cursor-pointer"
              title="Copy text"
            >
              {copied === item.id ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Copy</span>
                </>
              )}
            </button>*/}

          {/* Delete Button
            <button
              type="button"
              onClick={onConfirmDelete}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#FFF1F2] text-[#E11D48] hover:bg-rose-100 border border-rose-100 rounded-lg transition-colors cursor-pointer"
              title="Delete template"
            >
              <FiTrash2 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Delete</span>
            </button> */}
          {/* </div> */}
        </>
      )}
    </div>
  );
}
