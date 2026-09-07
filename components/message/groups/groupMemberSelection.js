import React, { useState, useEffect } from "react";
import { FiSearch, FiX, FiCheck, FiUser } from "react-icons/fi";

export default function GroupMemberSelection({
  contactsList = [],
  formData,
  setFormData,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContacts, setFilteredContacts] = useState(contactsList);

  useEffect(() => {
    const filtered = contactsList.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contactNo || "").includes(searchTerm)
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contactsList]);

  const handleMemberToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(id)
        ? prev.contactIds.filter((memberId) => memberId !== id)
        : [...prev.contactIds, id],
    }));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredContacts.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) =>
      formData.contactIds.includes(id)
    );

    if (allSelected) {
      // Unselect all filtered
      setFormData((prev) => ({
        ...prev,
        contactIds: prev.contactIds.filter((id) => !allFilteredIds.includes(id)),
      }));
    } else {
      // Select all filtered
      setFormData((prev) => ({
        ...prev,
        contactIds: Array.from(new Set([...prev.contactIds, ...allFilteredIds])),
      }));
    }
  };

  const selectedCount = formData?.contactIds?.length || 0;

  return (
    <div className="space-y-3 pt-2">
      {/* Header with Search and Member Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Select Group Members
          </label>
          <p className="text-[11px] text-slate-400 font-medium">
            <span className="font-bold text-[#2563EB]">{selectedCount}</span> of{" "}
            <span className="font-bold text-slate-700">{contactsList.length}</span> contacts selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Select / Deselect All Button */}
          {filteredContacts.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {filteredContacts.every((c) => formData.contactIds.includes(c.id))
                ? "Deselect All"
                : "Select All"}
            </button>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-white text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl outline-none transition-all shadow-2xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Contact Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 p-1">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => {
            const isSelected = formData?.contactIds?.includes(contact.id);
            const initial = (contact.name || "C").charAt(0).toUpperCase();

            return (
              <div
                key={contact.id}
                onClick={() => handleMemberToggle(contact.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#EBF5FF] border-blue-300 shadow-2xs ring-1 ring-blue-300"
                    : "bg-white hover:bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? "bg-[#2563EB] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isSelected ? <FiCheck className="w-3.5 h-3.5" /> : initial}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate" title={contact.name}>
                      {contact.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {contact.contactNo}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-1 ${
                    isSelected
                      ? "bg-[#2563EB] border-[#2563EB] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <FiCheck className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-8 text-center text-xs text-slate-400">
            <FiUser className="w-6 h-6 mx-auto mb-1 opacity-40" />
            <p>No contacts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
