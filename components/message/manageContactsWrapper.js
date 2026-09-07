import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  FiUser,
  FiUpload,
  FiUsers,
  FiPlusCircle,
  FiSearch,
  FiX,
} from "react-icons/fi";
import ManageContactsHeader from "../manageContacts/manageContactsHeader";
import AllContactsTab from "../manageContacts/allContactsTab";
import ImportContactsTab from "../manageContacts/importContactsTab";
import AllGroupsSection from "../manageContacts/allGroupsSection";
import CreateGroupTab from "../manageContacts/createGroupTab";

export default function ManageContactsWrapper({
  pageData,
  contacts = [],
  groups = [],
}) {
  const [contactsList, setContactsList] = useState(contacts);
  const [groupsList, setGroupsList] = useState(groups);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  const contactsTabs = [
    {
      id: "allContacts",
      label: `All Contacts (${contactsList.length})`,
      value: "allContacts",
      icon: FiUser,
    },
    {
      id: "import",
      label: "Import Contacts",
      value: "import",
      icon: FiUpload,
    },
    {
      id: "allGroups",
      label: `All Groups (${groupsList.length})`,
      value: "allGroups",
      icon: FiUsers,
    },
    {
      id: "createGroup",
      label: "Create Group",
      value: "createGroup",
      icon: FiPlusCircle,
    },
  ];

  const [selectedTab, setSelectedTab] = useState(
    pageData?.tab || contactsTabs[0].value
  );

  const handleTabClick = (tabId) => {
    if (pageData?.tab) {
      router.replace(router.pathname, undefined, { shallow: true });
    }
    setSelectedTab(tabId);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredContacts = contactsList.filter((contact) => {
    return (
      (contact.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.contactNo || "").includes(searchTerm)
    );
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* 1. Page Header with Title, Subtitle, and Illustration */}
      <ManageContactsHeader />

      {/* 2. Main Navigation Bar & Content Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-6">
        {/* Main Tabs Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {contactsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.value;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-blue-50/80 text-[#2563EB] border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar when on All Contacts or All Groups */}
          {(selectedTab === "allContacts" || selectedTab === "allGroups") && (
            <div className="relative w-full sm:w-64 shrink-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={selectedTab === "allContacts" ? "Search contacts..." : "Search groups..."}
                className="w-full pl-10 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all shadow-2xs text-slate-800 placeholder-slate-400"
                onChange={handleSearch}
                value={searchTerm}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                >
                  <FiX size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Tab Contents */}
        <div>
          {selectedTab === "allContacts" && (
            <AllContactsTab
              pageData={pageData}
              contactsList={filteredContacts}
              setContactsList={setContactsList}
              searchTerm={searchTerm}
              setSelectedTab={setSelectedTab}
            />
          )}

          {selectedTab === "allGroups" && (
            <AllGroupsSection
              pageData={pageData}
              contactsList={filteredContacts}
              setContactsList={setContactsList}
              searchTerm={searchTerm}
              groupsList={groupsList}
              setGroupsList={setGroupsList}
              setSelectedTab={setSelectedTab}
            />
          )}

          {selectedTab === "import" && (
            <ImportContactsTab
              pageData={pageData}
              setContactsList={setContactsList}
            />
          )}

          {selectedTab === "createGroup" && (
            <CreateGroupTab
              pageData={pageData}
              setGroupsList={setGroupsList}
              contactsList={contactsList}
            />
          )}
        </div>
      </div>
    </div>
  );
}
