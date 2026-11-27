"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiArrowLeft,
  FiBriefcase,
  FiTruck,
  FiUsers,
  FiShield,
  FiUserCheck,
  FiTool,
  FiPlus,
  FiEdit2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLayers,
  FiSearch,
  FiCalendar,
  FiExternalLink,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiChevronDown,
  FiPrinter,
  FiFileText,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiPlay,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { postApiData, resolveMediaUrl } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import CommonModal from "@/components/common/commonModal";
import FleetForm from "@/components/fleets/fleetForm";
import DriverForm from "@/components/drivers/driverForm";
import OrganizationModal from "@/components/users/organizationModal";
import UserFormModal from "@/components/users/userFormModal";
import { formatIndiaDateTime, formatIndiaDate } from "@/utilities/timeUtils";
import {
  exportMaintenanceHistoryCsv,
  exportMaintenanceHistoryPdf,
} from "@/utilities/exportUtils";

export default function OrganizationDetailsWrapper({ initialData, currentUser }) {
  const router = useRouter();

  // State management
  const [organization, setOrganization] = useState(initialData?.organization || {});
  const [summary, setSummary] = useState(initialData?.summary || {});
  const [fleets, setFleets] = useState(initialData?.fleets || []);
  const [users, setUsers] = useState(initialData?.users || []);
  const [drivers, setDrivers] = useState(initialData?.drivers || []);
  const [recentMaintenance, setRecentMaintenance] = useState(initialData?.recentMaintenance || []);

  const [activeTab, setActiveTab] = useState("fleets");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Maintenance export state
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef(null);

  // Maintenance details popup state
  const [selectedMaintenanceItem, setSelectedMaintenanceItem] = useState(null);
  const [loadingRecordDetails, setLoadingRecordDetails] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState(null); // { mediaList, activeIndex }

  // Keyboard navigation for image lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeMediaModal) return;
      if (e.key === "Escape") setActiveMediaModal(null);
      if (e.key === "ArrowLeft") {
        setActiveMediaModal((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.mediaList.length - 1,
        }));
      }
      if (e.key === "ArrowRight") {
        setActiveMediaModal((prev) => ({
          ...prev,
          activeIndex: prev.activeIndex < prev.mediaList.length - 1 ? prev.activeIndex + 1 : 0,
        }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaModal]);

  const handleOpenMaintenanceDetails = async (item) => {
    setSelectedMaintenanceItem(item);
    if (Number(item?.media_count || 0) > 0 && (!item.media || item.media.length === 0)) {
      setLoadingRecordDetails(true);
      try {
        const res = await postApiData("GET_MAINTENANCE_RECORD", { id: item.id });
        if (res?.status && res.data) {
          setSelectedMaintenanceItem((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch (err) {
        console.error("Error loading service log details:", err);
      } finally {
        setLoadingRecordDetails(false);
      }
    }
  };

  const getMediaUrl = (m) => {
    if (!m) return "";
    return m.signedUrl || m.file_url || m.url || resolveMediaUrl(m.s3_key || m.key);
  };

  const handleOpenMedia = (mediaList, index = 0) => {
    if (!mediaList || mediaList.length === 0) return;
    setActiveMediaModal({
      mediaList,
      activeIndex: index,
    });
  };

  // Close export dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    }
    if (exportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportMenuOpen]);

  // Active status
  const isActive = organization?.status !== "Inactive";

  // Filtered fleets
  const filteredFleets = useMemo(() => {
    if (!searchQuery.trim()) return fleets;
    const q = searchQuery.toLowerCase().trim();
    return fleets.filter(
      (f) =>
        f.vehicle_number?.toLowerCase().includes(q) ||
        f.vehicle_model?.toLowerCase().includes(q) ||
        f.vehicle_type?.toLowerCase().includes(q) ||
        f.driver_name?.toLowerCase().includes(q)
    );
  }, [fleets, searchQuery]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Handle fleet added
  const handleFleetAdded = (newFleet) => {
    setFleets((prev) => [newFleet, ...prev]);
    setSummary((prev) => ({
      ...prev,
      totalFleets: (prev.totalFleets || 0) + 1,
      activeFleets:
        newFleet.status === "Active" ? (prev.activeFleets || 0) + 1 : prev.activeFleets || 0,
    }));
    setIsFleetModalOpen(false);
    showToast(`Fleet "${newFleet.vehicle_number || "vehicle"}" added to ${organization.orgName}!`, "success");
  };

  // Handle driver added
  const handleDriverAdded = (newDriver) => {
    setDrivers((prev) => [newDriver, ...prev]);
    setSummary((prev) => ({
      ...prev,
      totalDrivers: (prev.totalDrivers || 0) + 1,
      assignedDrivers: newDriver.fleet_id
        ? (prev.assignedDrivers || 0) + 1
        : prev.assignedDrivers || 0,
      availableDrivers: !newDriver.fleet_id
        ? (prev.availableDrivers || 0) + 1
        : prev.availableDrivers || 0,
    }));
    setIsDriverModalOpen(false);
    showToast(
      `Driver "${newDriver.driver_name || "New Driver"}" added to ${organization.orgName || "Organization"}!`,
      "success"
    );
  };

  // Handle export maintenance history (same logic as tabPanels.js)
  const handleExportMaintenance = async (exportFormat = "csv") => {
    if (!organization?.orgId) return;
    setIsExporting(true);
    try {
      showToast(
        `Preparing maintenance ${exportFormat.toUpperCase()} report...`,
        "info"
      );

      const exportList = recentMaintenance;
      const fleetContext = {
        vehicle_number: `${organization.orgName || "Organization"} - All Vehicles`,
        vehicle_model: organization.orgCode || `ORG-${organization.orgId}`,
        organization_name: organization.orgName,
        orgName: organization.orgName,
      };

      const exportSummary = {
        ...summary,
        orgName: organization.orgName || "CARGODESK",
        total_records: recentMaintenance.length,
        total_expenditure:
          summary.totalMaintenanceCost ||
          recentMaintenance.reduce((acc, m) => acc + Number(m.cost || 0), 0),
      };

      if (exportFormat === "csv") {
        exportMaintenanceHistoryCsv(exportList, fleetContext, exportSummary);
        showToast("Maintenance history CSV downloaded successfully", "success");
      } else {
        exportMaintenanceHistoryPdf(exportList, fleetContext, exportSummary);
      }
    } catch (err) {
      console.error("Export error:", err);
      showToast("Failed to export maintenance records", "error");
    } finally {
      setIsExporting(false);
      setExportMenuOpen(false);
    }
  };

  // Handle update organization
  const handleUpdateOrg = async (formData) => {
    setIsSubmittingOrg(true);
    try {
      const payload = {
        orgId: organization.orgId,
        ...formData,
      };
      const res = await postApiData("UPDATE_ORGANIZATION", payload);
      if (res && res.status) {
        setOrganization((prev) => ({
          ...prev,
          ...formData,
        }));
        setIsEditOrgModalOpen(false);
        showToast("Organization details updated successfully!", "success");
      } else {
        showToast(res?.message || "Failed to update organization", "error");
      }
    } catch (err) {
      console.error("Error updating organization:", err);
      showToast("Error updating organization", "error");
    } finally {
      setIsSubmittingOrg(false);
    }
  };

  // Handle user added
  const handleUserCreated = async (formData) => {
    setIsSubmittingUser(true);
    try {
      const payload = {
        ...formData,
        orgId: organization.orgId,
      };
      const res = await postApiData("ADD_SUB_USER", payload);
      if (res && res.status) {
        const newUser = {
          userId: res.userId || Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);
        setSummary((prev) => ({
          ...prev,
          totalUsers: (prev.totalUsers || 0) + 1,
          adminCount:
            payload.role === "admin" ? (prev.adminCount || 0) + 1 : prev.adminCount || 0,
        }));
        setIsUserModalOpen(false);
        showToast(`User "${formData.firstName} ${formData.lastName}" registered successfully!`, "success");
      } else {
        showToast(res?.message || "Failed to add user", "error");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      showToast("Error adding user", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="space-y-2">
          <Link
            href="/users?tab=organizations"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to All Organizations</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-600/25">
              {organization.orgCode ? organization.orgCode.substring(0, 2) : "CD"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {organization.orgName}
                </h1>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {organization.orgCode || `ORG-${organization.orgId}`}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {isActive ? "Active Tenant" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Registered on {formatIndiaDate(organization.createdAt) || "N/A"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFleetModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FiPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Fleet</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDriverModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FiPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Driver</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUserModalOpen(true)}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FiUsers className="w-4 h-4 stroke-[2.5]" />
            <span>Add Member</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditOrgModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Edit Organization"
          >
            <FiEdit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Fleets */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fleets
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiTruck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.totalFleets || 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {summary.activeFleets || 0} active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Assigned vehicles</p>
        </div>

        {/* Metric 2: Team Members */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Team Members
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.totalUsers || 0}
            </span>
            <span className="text-[11px] font-semibold text-purple-600">
              {summary.adminCount || 0} admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Admins & staff personnel</p>
        </div>

        {/* Metric 3: Drivers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Drivers
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiUserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.totalDrivers || 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {summary.assignedDrivers || 0} assigned
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Registered driver profiles</p>
        </div>

        {/* Metric 4: Maintenance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Service Logs
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiTool className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.totalMaintenance || 0}
            </span>
            {Number(summary.totalMaintenanceCost || 0) > 0 && (
              <span className="text-[11px] font-semibold text-slate-600">
                ₹{Number(summary.totalMaintenanceCost).toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Recorded maintenance entries</p>
        </div>
      </div>

      {/* 3. Organization Profile Details Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FiBriefcase className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Organization Profile & Modules Provisioning
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Contact Details */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Contact Information</span>
            <div className="space-y-1.5 text-slate-700">
              {organization.contactEmail ? (
                <p className="flex items-center gap-2 truncate">
                  <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${organization.contactEmail}`}
                    className="hover:text-purple-600 truncate"
                  >
                    {organization.contactEmail}
                  </a>
                </p>
              ) : (
                <p className="text-slate-400">No contact email</p>
              )}
              {organization.contactPhone ? (
                <p className="flex items-center gap-2">
                  <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{organization.contactPhone}</span>
                </p>
              ) : (
                <p className="text-slate-400">No phone number</p>
              )}
            </div>
          </div>

          {/* Location & Address */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Address</span>
            <p className="text-slate-700 flex items-start gap-1.5 leading-relaxed">
              <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{organization.address || "No address specified."}</span>
            </p>
          </div>

          {/* Module Provisioning Badges */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Allowed System Modules</span>
              <span className="text-[10px] font-bold text-purple-700 font-mono">
                {Array.isArray(organization.allowedModules) ? organization.allowedModules.length : 9}/9 Active
              </span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Array.isArray(organization.allowedModules) &&
                organization.allowedModules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-bold capitalize"
                  >
                    {mod}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation and Content */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 sm:px-6 pt-2 bg-slate-50/50 flex-wrap gap-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab("fleets");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === "fleets"
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-xl"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiTruck className="w-4 h-4" />
              <span>Fleets ({fleets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("users");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === "users"
                  ? "border-purple-600 text-purple-600 bg-white rounded-t-xl"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Team & Admins ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("drivers");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === "drivers"
                  ? "border-emerald-600 text-emerald-600 bg-white rounded-t-xl"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiUserCheck className="w-4 h-4" />
              <span>Drivers ({drivers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("maintenance");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === "maintenance"
                  ? "border-amber-600 text-amber-600 bg-white rounded-t-xl"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiTool className="w-4 h-4" />
              <span>Service Logs ({recentMaintenance.length})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative pb-2 sm:pb-0">
            <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Tab 1: Fleets List */}
        {activeTab === "fleets" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assigned Fleets ({filteredFleets.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Vehicles configured under {organization.orgName}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>{ setIsFleetModalOpen(true) 
                  console.log("============")}}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Fleet to {organization.orgName}</span>
              </button>
            </div>

            {filteredFleets.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FiTruck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">No fleet vehicles assigned</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no vehicles under this organization yet. Click below to add the first vehicle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFleetModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Add First Vehicle</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Vehicle Number</th>
                      <th className="py-3 px-4">Make & Model</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Fuel & Capacity</th>
                      <th className="py-3 px-4">Assigned Driver</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredFleets.map((fleet) => (
                      <tr key={fleet.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {fleet.vehicle_number}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{fleet.vehicle_model}</span>
                          {fleet.manufacturing_year && (
                            <span className="text-[11px] text-slate-400 block">
                              Year {fleet.manufacturing_year}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{fleet.vehicle_type || "Heavy Truck"}</td>
                        <td className="py-3 px-4">
                          <span>{fleet.fuel_type || "Diesel"}</span>
                          {fleet.capacity && (
                            <span className="text-[11px] text-slate-400 block">{fleet.capacity}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {fleet.driver_name ? (
                            <div>
                              <span className="font-semibold text-slate-800 block">
                                {fleet.driver_name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {fleet.driver_contact || "No Contact"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              fleet.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : fleet.status === "In Maintenance"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {fleet.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/fleets/${fleet.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <span>Details</span>
                            <FiExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users & Staff List */}
        {activeTab === "users" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Organization Personnel ({filteredUsers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Administrators and staff allocated to {organization.orgName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUserModalOpen(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Member to {organization.orgName}</span>
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700">No personnel registered</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Add administrators or operations staff to manage this organization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Assign First Administrator</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredUsers.map((user) => {
                      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
                      const isAdmin = user.role === "admin";
                      const isSupervisor = user.role === "maintenance_supervisor";

                      return (
                        <tr key={user.userId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {fullName}
                          </td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.phone || "—"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAdmin
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : isSupervisor
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {isAdmin
                                ? "Administrator"
                                : isSupervisor
                                  ? "Maintenance Supervisor"
                                  : user.role || "Staff"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.status === "Active" || user.status === "1"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {user.status === "Active" || user.status === "1" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {formatIndiaDate(user.createdAt) || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Drivers List */}
        {activeTab === "drivers" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Organization Drivers ({drivers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Drivers associated with vehicles or registered for {organization.orgName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Driver</span>
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                <FiUserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700">No drivers recorded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No drivers are currently assigned to this organization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add First Driver</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Driver Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">License No</th>
                      <th className="py-3 px-4">Assigned Vehicle</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {driver.driver_name}
                        </td>
                        <td className="py-3 px-4">{driver.contact_number || "—"}</td>
                        <td className="py-3 px-4 font-mono">{driver.license_number || "—"}</td>
                        <td className="py-3 px-4">
                          {driver.vehicle_number ? (
                            <span className="font-mono font-bold text-blue-700">
                              {driver.vehicle_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              driver.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {driver.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Maintenance Records */}
        {activeTab === "maintenance" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Maintenance Activity History ({recentMaintenance.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Latest service logs recorded for vehicles under {organization.orgName}
                </p>
              </div>

              {/* Export Maintenance History Dropdown (same logic as tabPanels.js) */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  disabled={isExporting || recentMaintenance.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  title="Export maintenance history report"
                >
                  {isExporting ? (
                    <ImSpinner9 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <FiDownload className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>Export</span>
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10px] font-bold text-slate-400 px-3.5 py-1 uppercase tracking-wider">
                      Maintenance Export
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExportMaintenance("csv")}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FiFileText className="w-4 h-4 text-emerald-600" />
                      <span>Export as CSV / Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportMaintenance("pdf")}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FiPrinter className="w-4 h-4 text-blue-600" />
                      <span>Export as PDF (Print)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {recentMaintenance.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                <FiTool className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No service logs yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No maintenance records have been submitted for this organization yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Service Type</th>
                      <th className="py-3 px-4">Problem / Details</th>
                      <th className="py-3 px-4">Service Date</th>
                      <th className="py-3 px-4">Cost</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentMaintenance.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => handleOpenMaintenanceDetails(m)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {m.vehicle_number || `#${m.vehicle_id}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {m.maintenance_type}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {m.description || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatIndiaDate(m.maintenance_date || m.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          ₹{Number(m.cost || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : m.status === "In Progress"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {m.status || "Reported"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMaintenanceDetails(m);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* Modal 1: Add Fleet under this Organization */}
      <CommonModal
        modalOpen={isFleetModalOpen}
        setModalOpen={setIsFleetModalOpen}
        modalTitle={`Add New Fleet to ${organization.orgName || "Organization"}`}
        modalSize="w-11/12 md:w-[680px]"
      >
        <FleetForm
          preselectedOrgId={organization.orgId}
          organizations={[organization]}
          currentUser={currentUser}
          onSuccess={handleFleetAdded}
          onClose={() => setIsFleetModalOpen(false)}
          toggleModal={() => setIsFleetModalOpen(false)}
        />
      </CommonModal>

      {/* Modal 2: Add Driver under this Organization */}
      <CommonModal
        modalOpen={isDriverModalOpen}
        setModalOpen={setIsDriverModalOpen}
        modalTitle={`Add New Driver to ${organization.orgName || "Organization"}`}
        modalSize="w-11/12 md:w-[720px]"
      >
        <DriverForm
          preselectedOrgId={organization.orgId}
          organizations={[organization]}
          currentUser={currentUser}
          onSuccess={handleDriverAdded}
          onClose={() => setIsDriverModalOpen(false)}
          toggleModal={() => setIsDriverModalOpen(false)}
        />
      </CommonModal>

      {/* Modal 3: Edit Organization Profile */}
      <OrganizationModal
        isOpen={isEditOrgModalOpen}
        onClose={() => setIsEditOrgModalOpen(false)}
        onSubmit={handleUpdateOrg}
        isEdit={true}
        orgData={organization}
        isSubmitting={isSubmittingOrg}
      />

      {/* Modal 4: Add User/Member to this Organization */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserCreated}
        isEdit={false}
        userData={{ orgId: organization.orgId }}
        organizations={[organization]}
        currentUser={currentUser}
        isSubmitting={isSubmittingUser}
      />

      {/* Modal 5: Service Log Item Details */}
      {selectedMaintenanceItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedMaintenanceItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <FiTool className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      {selectedMaintenanceItem.maintenance_type || "Service Record"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedMaintenanceItem.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedMaintenanceItem.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {selectedMaintenanceItem.status || "Reported"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Log #{selectedMaintenanceItem.id} • Vehicle: {selectedMaintenanceItem.vehicle_number || `#${selectedMaintenanceItem.vehicle_id}`}
                    {selectedMaintenanceItem.vehicle_model ? ` (${selectedMaintenanceItem.vehicle_model})` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMaintenanceItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Date</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatIndiaDate(selectedMaintenanceItem.maintenance_date || selectedMaintenanceItem.created_at)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Cost</p>
                  <p className="text-xs font-bold text-emerald-600 mt-1 font-mono">
                    ₹{Number(selectedMaintenanceItem.cost || 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Odometer</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1 font-mono">
                    {selectedMaintenanceItem.odometer_reading
                      ? `${Number(selectedMaintenanceItem.odometer_reading).toLocaleString("en-IN")} km`
                      : "—"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice / Ref #</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1 font-mono truncate" title={selectedMaintenanceItem.invoice_number || "—"}>
                    {selectedMaintenanceItem.invoice_number || "—"}
                  </p>
                </div>
              </div>

              {/* Garage / Vendor Info */}
              {selectedMaintenanceItem.garage_name && (
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Garage / Service Center</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedMaintenanceItem.garage_name}</p>
                  </div>
                  {selectedMaintenanceItem.created_by && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Logged By User</p>
                      <p className="text-xs font-mono font-medium text-slate-600 mt-0.5">#{selectedMaintenanceItem.created_by}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Problem Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FiFileText className="w-3.5 h-3.5 text-slate-400" />
                  Problem / Work Description
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {selectedMaintenanceItem.description || "No description recorded."}
                </div>
              </div>

              {/* Additional Notes if any */}
              {selectedMaintenanceItem.additional_notes && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Additional Notes / Recommendations</label>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900 leading-relaxed whitespace-pre-wrap text-xs">
                    {selectedMaintenanceItem.additional_notes}
                  </div>
                </div>
              )}

              {/* Attached Media */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">
                  Attachments & Media ({selectedMaintenanceItem.media?.length || selectedMaintenanceItem.media_count || 0})
                </label>
                {loadingRecordDetails ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <ImSpinner9 className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Loading signed attachment media...</p>
                  </div>
                ) : selectedMaintenanceItem.media && selectedMaintenanceItem.media.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedMaintenanceItem.media.map((file, idx) => {
                      const isVideo = file.media_type === "video" || file.file_type === "video" || file.mime_type?.startsWith("video/");
                      const mediaUrl = getMediaUrl(file);

                      return (
                        <div
                          key={file.id || idx}
                          className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group hover:shadow-md transition-shadow flex flex-col"
                        >
                          {isVideo ? (
                            <div className="relative aspect-video bg-black flex items-center justify-center">
                              <video src={mediaUrl} controls className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenMedia(selectedMaintenanceItem.media, idx)}
                              className="block relative aspect-video bg-slate-100 overflow-hidden cursor-pointer w-full text-left"
                            >
                              <img
                                src={mediaUrl}
                                alt={file.file_name || `Media ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5">
                                <FiMaximize2 className="w-4 h-4" />
                                <span className="text-[11px] font-bold">Preview</span>
                              </div>
                            </button>
                          )}
                          <div className="p-2 text-[10px] truncate font-mono text-slate-600 bg-white border-t border-slate-100 flex items-center justify-between mt-auto">
                            <span className="truncate">{file.file_name || `Attachment ${idx + 1}`}</span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {!isVideo && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMedia(selectedMaintenanceItem.media, idx)}
                                  className="text-slate-500 hover:text-blue-600 p-0.5 cursor-pointer"
                                  title="View full image"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {mediaUrl && (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-0.5 cursor-pointer"
                                  title="Open in new tab"
                                >
                                  <FiExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No media attachments attached to this service record.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {selectedMaintenanceItem.vehicle_id ? (
                <Link
                  href={`/maintenance/vehicle-history/${selectedMaintenanceItem.vehicle_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>View full history for this vehicle</span>
                  <FiExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedMaintenanceItem(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Media Preview Lightbox */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveMediaModal(null)}
        >
          {/* Lightbox Topbar */}
          <div
            className="flex items-center justify-between text-white max-w-5xl mx-auto w-full z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono font-semibold">
                {activeMediaModal.activeIndex + 1} / {activeMediaModal.mediaList.length}
              </span>
              <p className="text-xs sm:text-sm font-medium truncate max-w-xs sm:max-w-md">
                {activeMediaModal.mediaList[activeMediaModal.activeIndex]?.file_name || "Attachment"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getMediaUrl(activeMediaModal.mediaList[activeMediaModal.activeIndex]) && (
                <a
                  href={getMediaUrl(activeMediaModal.mediaList[activeMediaModal.activeIndex])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Open original in new tab"
                >
                  <FiExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveMediaModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Content */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 max-w-5xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow */}
            {activeMediaModal.mediaList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveMediaModal((prev) => ({
                    ...prev,
                    activeIndex: prev.activeIndex > 0 ? prev.activeIndex - 1 : prev.mediaList.length - 1,
                  }))
                }
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs"
                title="Previous (Left Arrow)"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Media Content */}
            {(() => {
              const item = activeMediaModal.mediaList[activeMediaModal.activeIndex];
              const isVideo = item?.media_type === "video" || item?.file_type === "video" || item?.mime_type?.startsWith("video/");
              const url = getMediaUrl(item);

              if (isVideo) {
                return (
                  <video
                    controls
                    autoPlay
                    src={url}
                    className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl bg-black"
                  />
                );
              }

              return (
                <div className="relative max-h-[72vh] max-w-full flex items-center justify-center">
                  <img
                    src={url}
                    alt={item?.file_name || "Attachment"}
                    className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl"
                  />
                </div>
              );
            })()}

            {/* Next Arrow */}
            {activeMediaModal.mediaList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveMediaModal((prev) => ({
                    ...prev,
                    activeIndex: prev.activeIndex < prev.mediaList.length - 1 ? prev.activeIndex + 1 : 0,
                  }))
                }
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer backdrop-blur-xs"
                title="Next (Right Arrow)"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {activeMediaModal.mediaList.length > 1 && (
            <div
              className="max-w-5xl mx-auto w-full pt-2 pb-1 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {activeMediaModal.mediaList.map((m, idx) => {
                const isVideo = m.media_type === "video" || m.file_type === "video" || m.mime_type?.startsWith("video/");
                const url = getMediaUrl(m);
                const isSelected = idx === activeMediaModal.activeIndex;

                return (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() =>
                      setActiveMediaModal((prev) => ({ ...prev, activeIndex: idx }))
                    }
                    className={`relative w-14 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "border-blue-500 scale-105 shadow-md"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isVideo ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                        <FiPlay className="w-3 h-3" />
                      </div>
                    ) : (
                      <img src={url} alt="thumb" className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
