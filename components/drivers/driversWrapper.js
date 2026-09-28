import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../common/pageHeader";
import DocumentTable from "../common/tabels/documentTable";
import CommonModal from "../common/commonModal";
import DriverForm from "./driverForm";
import DriverDocumentsViewer from "./driverDocumentsViewer";
import { driverTableHeadCells } from "@/utilities/masterData";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { useFleetDriver } from "@/context/fleetDriverContext";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { ImSpinner9 } from "react-icons/im";

export default function DriversWrapper({ pageData }) {
  const { drivers: contextDrivers, loading: contextLoading, refreshAll } = useFleetDriver();
  const [driverList, setDriverList] = useState(pageData?.drivers || []);
  const [driverModal, setDriverModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!pageData?.drivers && !contextDrivers.length);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState(null);
  const [focusField, setFocusField] = useState(null);

  // Sync with context drivers whenever updated
  useEffect(() => {
    if (contextDrivers && contextDrivers.length > 0) {
      setDriverList(contextDrivers);
      setIsLoading(false);
    }
  }, [contextDrivers]);

  // Fetch drivers if not provided via SSR or context
  useEffect(() => {
    if (!pageData?.drivers && (!contextDrivers || contextDrivers.length === 0)) {
      setIsLoading(true);
      postApiData("GET_ALL_DRIVERS")
        .then((res) => {
          if (res?.status && Array.isArray(res.data)) {
            setDriverList(res.data);
          }
        })
        .catch((err) => console.error("Error fetching driver list:", err))
        .finally(() => setIsLoading(false));
    }
  }, [pageData, contextDrivers]);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = driverList.length;
    let assigned = 0;
    let unassigned = 0;
    let onLeave = 0;

    driverList.forEach((item) => {
      const isAssigned = Boolean(item.fleet_id || item.assigned_vehicle);
      if (isAssigned) {
        assigned += 1;
      } else {
        unassigned += 1;
      }

      const s = (item.status || "").toLowerCase();
      if (s === "on leave" || s === "on_leave" || s === "leave") {
        onLeave += 1;
      }
    });

    return { total, assigned, unassigned, onLeave };
  }, [driverList]);

  // Filtered display data
  const finalDisplayData = useMemo(() => {
    let result = driverList;

    // Filter by status / assignment
    if (statusFilter !== "all") {
      result = result.filter((item) => {
        const isAssigned = Boolean(item.fleet_id || item.assigned_vehicle);
        if (statusFilter === "assigned") return isAssigned;
        if (statusFilter === "unassigned") return !isAssigned;
        if (statusFilter === "on_leave") {
          const s = (item.status || "").toLowerCase();
          return s === "on leave" || s === "on_leave" || s === "leave";
        }
        if (statusFilter === "active") {
          const s = (item.status || "").toLowerCase();
          return s === "active" || item.status === 1;
        }
        return true;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const name = (item.driver_name || item.name || "").toLowerCase();
        const contact = (item.contact_number || item.contactNo || "").toLowerCase();
        const altContact = (item.alt_contact_number || "").toLowerCase();
        const license = (item.license_number || "").toLowerCase();
        const licenseType = (item.license_type || "").toLowerCase();
        const veh = (item.assigned_vehicle || item.vehicleNo || "").toLowerCase();
        const exp = (item.experience_years || "").toLowerCase();
        const note = (item.notes || item.note || "").toLowerCase();
        return (
          name.includes(q) ||
          contact.includes(q) ||
          altContact.includes(q) ||
          license.includes(q) ||
          licenseType.includes(q) ||
          veh.includes(q) ||
          exp.includes(q) ||
          note.includes(q)
        );
      });
    }

    return result;
  }, [driverList, statusFilter, searchTerm]);

  // Handle Add Driver CTA
  const onClickAddDriver = () => {
    setIsEdit(false);
    setModalData(null);
    setDriverModal(true);
  };

  // Handle View Supporting Documents
  const handleViewDocuments = (driverRow) => {
    setSelectedDriverForDocs(driverRow);
    setDocsModalOpen(true);
  };

  // Handle Edit Trigger from Document Viewer
  const handleEditFromDocs = (driverRow) => {
    setDocsModalOpen(false);
    onClickEdit(driverRow.id);
  };

  // Handle Edit Driver
  const onClickEdit = (id, row, field) => {
    const targetId = id ?? row?.id;
    const selectedItem =
      (typeof row === "object" && row !== null && row.id ? row : null) ||
      driverList.find((item) => item.id == targetId);
    if (selectedItem) {
      setModalData(selectedItem);
      setIsEdit(true);
      setFocusField(field || null);
      setDriverModal(true);
    }
  };

  // Handle Delete Driver
  const onClickDelete = async (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    setDeleteLoad(true);
    try {
      const response = await postApiData("DELETE_DRIVERS", { ids: targetIds });
      if (response && response.status) {
        setDriverList((prev) =>
          prev.filter((item) => !targetIds.includes(item.id))
        );
        showToast(
          response.message ||
            `${targetIds.length} driver record${targetIds.length > 1 ? "s" : ""} deleted successfully`,
          "success"
        );
        setDeletePopup(false);
        setSelected([]);
      } else {
        showToast(response?.message || "Failed to delete driver record(s)", "error");
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      showToast("Error occurred while deleting driver record.", "error");
    }
    setDeleteLoad(false);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Personnel & Logistics"
        title="Driver Management"
        subtitle="Manage, track, and assign transport drivers, monitor license validities, and oversee duty status in real time."
      />

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Drivers Card */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "all"
              ? "border-blue-500 ring-2 ring-blue-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Drivers
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.total}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            All registered drivers
          </span>
        </div>

        {/* Fleet Assigned Drivers Card */}
        <div
          onClick={() => setStatusFilter("assigned")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "assigned"
              ? "border-emerald-500 ring-2 ring-emerald-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Fleet Assigned
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.assigned}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            Assigned to a fleet vehicle
          </span>
        </div>

        {/* Unassigned Drivers Card */}
        <div
          onClick={() => setStatusFilter("unassigned")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "unassigned"
              ? "border-indigo-500 ring-2 ring-indigo-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Unassigned Drivers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.unassigned}
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">
            Available for vehicle assignment
          </span>
        </div>

        {/* On Leave Card */}
        <div
          onClick={() => setStatusFilter("on_leave")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "on_leave"
              ? "border-amber-500 ring-2 ring-amber-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              On Leave / Rest
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.onLeave}
          </div>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 block">
            Scheduled off / leave
          </span>
        </div>
      </div>

      {/* Main White Container: Toolbar + DocumentTable */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-5">
        {/* Toolbar: Search, Filter, + Add Driver CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Title + Count */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              All Transport Drivers
            </h2>
            {isLoading ? (
              <span className="inline-flex items-center justify-center bg-blue-100/70 w-8 h-5 rounded-full animate-pulse" />
            ) : (
              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {finalDisplayData.length}
              </span>
            )}
          </div>

          {/* Right Controls: Search, Status Filter, Add Button */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72 md:w-80">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, contact, license, or vehicle..."
                className="w-full pl-10 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 hover:border-slate-300 text-slate-800 placeholder-slate-400 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status / Assignment Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border transition-all cursor-pointer ${
                  statusFilter !== "all" || filterMenuOpen
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                <span>
                  {statusFilter === "all"
                    ? "Filter Drivers"
                    : statusFilter === "assigned"
                    ? "Fleet Assigned"
                    : statusFilter === "unassigned"
                    ? "Unassigned Drivers"
                    : statusFilter === "on_leave"
                    ? "On Leave"
                    : "Filtered"}
                </span>
                {statusFilter !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-dropdown">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Filter by Assignment / Status
                  </div>
                  {[
                    { id: "all", label: "All Drivers" },
                    { id: "assigned", label: "Fleet Assigned Drivers" },
                    { id: "unassigned", label: "Unassigned Drivers" },
                    { id: "on_leave", label: "On Leave / Rest" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setFilterMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === opt.id
                          ? "bg-blue-100 text-blue-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.id && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* + Add New Driver CTA Button */}
            <button
              type="button"
              onClick={onClickAddDriver}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add New Driver</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== "all" || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400">Active filters:</span>
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span>
                  Filter:{" "}
                  {statusFilter === "assigned"
                    ? "Fleet Assigned"
                    : statusFilter === "unassigned"
                    ? "Unassigned Drivers"
                    : statusFilter === "on_leave"
                    ? "On Leave"
                    : statusFilter}
                </span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="text-blue-500 hover:text-blue-800"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span>Search: &quot;{searchTerm}&quot;</span>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchTerm("");
              }}
              className="text-xs text-slate-400 hover:text-slate-700 underline font-medium ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Common DocumentTable for Driver records */}
        <DocumentTable
          rows={finalDisplayData}
          headCells={driverTableHeadCells}
          onClickEdit={onClickEdit}
          onClickDocuments={handleViewDocuments}
          selected={selected}
          setSelected={setSelected}
          onClickDelete={(ids) => {
            setSelected(Array.isArray(ids) ? ids : [ids]);
            setDeletePopup(true);
          }}
          searchTerm={searchTerm}
          rowsPerPageOptions={[5, 10, 25, 50]}
          isLoading={isLoading}
          tableName="drivers"
          // pageSize={pageSize}
          // setPageSize={setPageSize}
          // currentPage={currentPage}
          // setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Supporting Documents Viewer Modal */}
      <CommonModal
        modalTitle="Driver Supporting Documents"
        modalOpen={docsModalOpen}
        setModalOpen={setDocsModalOpen}
        modalSize="w-11/12 md:w-[750px] lg:w-[840px]"
      >
        <DriverDocumentsViewer
          driver={selectedDriverForDocs}
          onClose={() => setDocsModalOpen(false)}
          onEdit={handleEditFromDocs}
        />
      </CommonModal>

      {/* Add / Edit Driver Modal */}
      <CommonModal
        modalTitle={isEdit ? "Edit Driver Details" : "Add New Driver"}
        modalOpen={driverModal}
        setModalOpen={(open) => {
          setDriverModal(open);
          if (!open) setFocusField(null);
        }}
        modalSize="w-11/12 md:w-[680px]"
      >
        <DriverForm
          setDriverList={setDriverList}
          modalData={modalData}
          isEdit={isEdit}
          focusField={focusField}
          toggleModal={() => setDriverModal(false)}
          onClose={() => setDriverModal(false)}
        />
      </CommonModal>

      {/* Delete Confirmation Modal */}
      <CommonModal
        modalTitle="Delete Driver Record"
        modalOpen={deletePopup}
        setModalOpen={setDeletePopup}
        modalSize="w-11/12 sm:w-96"
      >
        <div className="px-5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Delete Driver Record{selected.length > 1 ? "s" : ""}?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete {selected.length > 1 ? `${selected.length} selected drivers` : "this driver"}? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletePopup(false)}
              className="px-4 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onClickDelete(selected)}
              disabled={deleteLoad}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleteLoad ? (
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
      </CommonModal>
    </div>
  );
}
