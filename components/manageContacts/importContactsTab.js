import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { RiFileExcel2Line } from "react-icons/ri";
import { BsPersonVcard } from "react-icons/bs";
import { MdOutlineDialpad } from "react-icons/md";
import GoogleContacts from "../message/googleContacts";
import ContactsFromCSV from "../message/import/contactsFromCSV";
import ContactsFromVCF from "../message/import/contactsFromVCF";
import ManualAddForm from "../message/import/manualAddForm";
import ContactsPreviewList from "../message/import/contactsPreviewList";

const importTabs = [
  {
    id: "google",
    label: "Google",
    icon: FcGoogle,
    color: "text-slate-700",
    activeColor: "bg-[#EBF5FF] text-[#2563EB] border-[#3B82F6]",
  },
  {
    id: "csv",
    label: "CSV",
    icon: RiFileExcel2Line,
    color: "text-emerald-600",
    activeColor: "bg-emerald-50 text-emerald-700 border-emerald-500",
  },
  {
    id: "vcf",
    label: "vCard",
    icon: BsPersonVcard,
    color: "text-blue-600",
    activeColor: "bg-blue-50 text-blue-700 border-blue-500",
  },
  {
    id: "manual",
    label: "Manual",
    icon: MdOutlineDialpad,
    color: "text-purple-600",
    activeColor: "bg-purple-50 text-purple-700 border-purple-500",
  },
];

export default function ImportContactsTab({ pageData, setContactsList }) {
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState("google");
  const [apiSuccess, setApiSuccess] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 pt-2">
      {/* 1. Left Vertical Sub-Tabs */}
      <div className="w-full lg:w-48 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
        {importTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setContacts([]);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap border text-left ${
                isActive
                  ? `${tab.activeColor} shadow-2xs`
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${tab.id !== "google" && !isActive ? tab.color : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Right Content Area */}
      <div className="flex-1 w-full space-y-6">
        {/* Google Import Card */}
        {activeTab === "google" && (
          <GoogleContacts
            contacts={contacts}
            setContacts={setContacts}
          />
        )}

        {/* CSV Import Card */}
        {activeTab === "csv" && (
          <ContactsFromCSV
            contacts={contacts}
            setContacts={setContacts}
            apiSuccess={apiSuccess}
          />
        )}

        {/* vCard Import Card */}
        {activeTab === "vcf" && (
          <ContactsFromVCF
            contacts={contacts}
            setContacts={setContacts}
            apiSuccess={apiSuccess}
          />
        )}

        {/* Manual Add Card */}
        {activeTab === "manual" && (
          <ManualAddForm
            setContacts={setContacts}
            pageData={pageData}
            setContactsList={setContactsList}
          />
        )}

        {/* Imported Contacts Preview (renders whenever contacts are parsed from Google, CSV, or vCard) */}
        <ContactsPreviewList
          contacts={contacts}
          setContacts={setContacts}
          pageData={pageData}
          apiSuccess={apiSuccess}
          setApiSuccess={setApiSuccess}
          setContactsList={setContactsList}
        />
      </div>
    </div>
  );
}
