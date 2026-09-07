import React, { useEffect, useRef } from "react";
import { parseVCF } from "@/utilities/vcfParser";
import { BsPersonVcard } from "react-icons/bs";

export default function ContactsFromVCF({ contacts, setContacts, apiSuccess }) {
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (apiSuccess) {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [apiSuccess]);

  const handleVCFImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rawContacts = parseVCF(text);

      const seen = new Set();

      const cleanedContacts = (rawContacts || [])
        .map((contact) => {
          const name = contact.name?.trim() || "";
          let contactNo = contact.contactNo?.replace(/\D/g, "") || "";

          if (contactNo.length > 10) {
            contactNo = contactNo.slice(-10);
          }

          if (contactNo.length === 10 && !seen.has(contactNo)) {
            seen.add(contactNo);
            return { name, contactNo };
          }

          return null;
        })
        .filter(Boolean);

      setContacts(cleanedContacts);
    } catch (err) {
      console.warn("vCard import parse error", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header Row */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
          <BsPersonVcard className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Import Contacts (vCard)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Upload a .vcf file to import contacts into CargoDesk.
          </p>
        </div>
      </div>

      {/* Styled File Input Box */}
      <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <input
          type="file"
          accept=".vcf"
          ref={fileInputRef}
          onChange={handleVCFImport}
          className="block w-full text-xs sm:text-sm text-slate-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-xl file:border file:border-blue-100
            file:text-xs file:font-bold
            file:bg-[#EBF5FF] file:text-[#2563EB]
            hover:file:bg-blue-100
            file:cursor-pointer cursor-pointer"
        />
      </div>

      {/* Helper Footer Note */}
      <p className="text-xs text-slate-400 font-medium">
        Accepted format: <code className="text-slate-600 font-bold">.vcf</code> only. Must contain <code className="text-slate-600 font-bold">name</code> and <code className="text-slate-600 font-bold">contactNo</code> information.
      </p>
    </div>
  );
}
