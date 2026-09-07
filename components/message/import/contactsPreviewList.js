import React, { useState } from "react";
import { FiCheck, FiTrash2, FiUserCheck, FiUsers } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";

export default function ContactsPreviewList({
  pageData,
  contacts = [],
  setContacts,
  apiSuccess,
  setApiSuccess,
  setContactsList,
}) {
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  if (!contacts || contacts.length === 0) return null;

  const handleDelete = (index) => {
    showToast({
      message: "Contact removed from preview list.",
      type: "success",
    });
    setContacts(contacts.filter((_, i) => i !== index));
    setConfirmIndex(null);
  };

  const saveAllContacts = async () => {
    setApiLoading(true);

    try {
      const payload = {
        id: pageData?.user?.userId,
        contacts: contacts.map((c) => ({
          name: c.name,
          contactNo: c.contactNo,
          note: c.note || "",
        })),
      };
      const response = await postApiData("IMPORT_CONTACTS_IN_BLUK", payload);
      if (response.status) {
        if (setContactsList) {
          setContactsList((prev) => [...prev, ...contacts]);
        }
        showToast({
          message: `${contacts.length} contacts saved successfully!`,
          type: "success",
        });
        setContacts([]);
        if (setApiSuccess) setApiSuccess(true);
      } else {
        showToast({
          message: response.message || "Failed to import contacts",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Import contacts failed", err);
      showToast({
        message: "Error saving contacts. Please try again.",
        type: "error",
      });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 animate-fade-in">
      {/* Header with Title and Save All Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-xs">
            <FiUserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Imported Contacts Preview
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Review contacts before saving them to CargoDesk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-50 text-[#2563EB] font-bold text-xs rounded-full border border-blue-100">
            {contacts.length} Contact{contacts.length > 1 ? "s" : ""}
          </span>

          <button
            type="button"
            onClick={saveAllContacts}
            disabled={apiLoading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {apiLoading ? (
              <>
                <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving All...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>Save All Contacts</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
        {contacts.map((c, i) => {
          const isConfirm = confirmIndex === i;
          const initial = (c.name || "C").charAt(0).toUpperCase();

          return (
            <div
              key={i}
              className="relative bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:bg-white hover:border-slate-300 transition-all"
            >
              {isConfirm ? (
                <div className="w-full flex items-center justify-between gap-2 bg-rose-50 p-1.5 rounded-lg border border-rose-200 animate-fade-in">
                  <span className="text-[11px] font-bold text-rose-800">
                    Delete?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmIndex(null)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate" title={c.name}>
                        {c.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        {c.contactNo}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmIndex(i)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove Contact"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
