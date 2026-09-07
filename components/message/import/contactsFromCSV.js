import React, { useEffect, useRef, useState } from "react";
import { FiUpload, FiDownload, FiFileText, FiCheckCircle } from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";
import Papa from "papaparse";

export default function ContactsFromCSV({ contacts, setContacts, apiSuccess }) {
  const [selectedCSVFile, setSelectedCSVFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (apiSuccess) {
      setSelectedCSVFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [apiSuccess]);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedCSVFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const seen = new Set();

        const parsedContacts = results.data
          .map((row) => {
            const name = row.name?.trim() || "";
            let contactNo = row.contactNo?.replace(/\D/g, "") || "";

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

        setContacts(parsedContacts);
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
            <RiFileExcel2Line className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Import Contacts (CSV)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Upload a CSV file to import multiple contacts at once.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Need a format?</span>
          <a
            href="/downloads/sampleContacts.csv"
            download="sampleContacts.csv"
            className="text-[#2563EB] hover:text-blue-800 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </a>
        </div>
      </div>

      {/* Styled File Input Box */}
      <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
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
        Accepted format: <code className="text-slate-600 font-bold">.csv</code> only. Must contain <code className="text-slate-600 font-bold">name</code> and <code className="text-slate-600 font-bold">contactNo</code> columns.
      </p>
    </div>
  );
}
