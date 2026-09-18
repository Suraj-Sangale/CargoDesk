import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../common/pageHeader";
import DocumentTable from "../common/tabels/documentTable";
import CommonModal from "../common/commonModal";
import FleetForm from "./fleetForm";
import { fleetTableHeadCells } from "@/utilities/masterData";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { useFleetDriver } from "@/context/fleetDriverContext";
import { getConstant } from "@/utilities/utils";
import {
  FiTruck,
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiActivity,
  FiTool,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export default function FleetsWrapper({ pageData }) {
  const { fleets: contextFleets, loading: contextLoading, refreshAll } = useFleetDriver();
  const [fleetList, setFleetList] = useState(pageData?.fleets || []);
  const [fleetModal, setFleetModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!pageData?.fleets && !contextFleets.length);

  // Sync with context fleets whenever updated
  useEffect(() => {
    if (contextFleets && contextFleets.length > 0) {
      setFleetList(contextFleets);
      setIsLoading(false);
    }
  }, [contextFleets]);

  // Fetch fleets if not provided via SSR or context
  useEffect(() => {
    if (!pageData?.fleets && (!contextFleets || contextFleets.length === 0)) {
      setIsLoading(true);
      postApiData("GET_ALL_FLEETS")
        .then((res) => {
          if (res?.status && Array.isArray(res.data)) {
            setFleetList(res.data);
          }
        })
        .catch((err) => console.error("Error fetching fleet list:", err))
        .finally(() => setIsLoading(false));
    }
  }, [pageData, contextFleets]);

  // Compute summary stats
  const stats = useMemo(() => {
    const total = fleetList.length;
    let active = 0;
    let inTransit = 0;
    let maintenance = 0;
    let inactive = 0;

    fleetList.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s === "active" || item.status === 1 || item.status === "1") {
        active += 1;
      } else if (s === "in transit" || s === "in_transit") {
        inTransit += 1;
      } else if (s === "maintenance" || s === "in maintenance") {
        maintenance += 1;
      } else {
        inactive += 1;
      }
    });

    return { total, active, inTransit, maintenance, inactive };
  }, [fleetList]);

  // Filtered display data
  const finalDisplayData = useMemo(() => {
    let result = fleetList;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((item) => {
        const s = (item.status || "").toLowerCase();
        if (statusFilter === "active") return s === "active" || item.status === 1;
        if (statusFilter === "in_transit") return s === "in transit" || s === "in_transit";
        if (statusFilter === "maintenance") return s === "maintenance" || s === "in maintenance";
        if (statusFilter === "inactive") return s === "inactive" || s === "closed" || item.status === 0;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const vehNo = (item.vehicle_number || "").toLowerCase();
        const model = (item.vehicle_model || "").toLowerCase();
        const driver = (item.driver_name || "").toLowerCase();
        const type = (item.vehicle_type || "").toLowerCase();
        const cap = (item.capacity || "").toLowerCase();
        const note = (item.notes || "").toLowerCase();
        return (
          vehNo.includes(q) ||
          model.includes(q) ||
          driver.includes(q) ||
          type.includes(q) ||
          cap.includes(q) ||
          note.includes(q)
        );
      });
    }

    return result;
  }, [fleetList, statusFilter, searchTerm]);

  // Handle Add Fleet CTA
  const onClickAddFleet = () => {
    setIsEdit(false);
    setModalData(null);
    setFleetModal(true);
  };

  // Handle Edit Fleet
  const onClickEdit = (id) => {
    const selectedItem = fleetList.find((item) => item.id == id);
    if (selectedItem) {
      setModalData(selectedItem);
      setIsEdit(true);
      setFleetModal(true);
    }
  };

  // Handle Delete Fleet
  const onClickDelete = async (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    setDeleteLoad(true);
    try {
      const response = await postApiData("DELETE_FLEETS", { ids: targetIds });
      if (response && response.status) {
        setFleetList((prev) =>
          prev.filter((item) => !targetIds.includes(item.id))
        );
        showToast(
          response.message ||
            `${targetIds.length} vehicle(s) deleted successfully`,
          "success"
        );
        setDeletePopup(false);
        setSelected([]);
      } else {
        showToast(response?.message || "Failed to delete fleet vehicles", "error");
      }
    } catch (error) {
      console.error("Error deleting fleet:", error);
      showToast("Error occurred while deleting fleet record.", "error");
    }
    setDeleteLoad(false);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Fleet Operations"
        title="Fleet Management"
        subtitle="Manage and monitor all your transport vehicles, drivers, payload capacities, and operational status in real time."
      />

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fleets Card */}
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
              Total Fleet
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiTruck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.total}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            All registered vehicles
          </span>
        </div>

        {/* Active Fleets Card */}
        <div
          onClick={() => setStatusFilter("active")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "active"
              ? "border-emerald-500 ring-2 ring-emerald-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Active / Ready
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.active}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            Available for dispatch
          </span>
        </div>

        {/* In Transit Card */}
        <div
          onClick={() => setStatusFilter("in_transit")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "in_transit"
              ? "border-blue-500 ring-2 ring-blue-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              In Transit
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiActivity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.inTransit}
          </div>
          <span className="text-[11px] font-semibold text-blue-600 mt-1 block">
            On delivery route
          </span>
        </div>

        {/* In Maintenance Card */}
        <div
          onClick={() => setStatusFilter("maintenance")}
          className={`bg-white rounded-2xl p-4 md:p-5 border transition-all cursor-pointer shadow-2xs hover:shadow-md ${
            statusFilter === "maintenance"
              ? "border-amber-500 ring-2 ring-amber-500/10"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              In Maintenance
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiTool className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {stats.maintenance}
          </div>
          <span className="text-[11px] font-semibold text-amber-600 mt-1 block">
            Servicing or repairs
          </span>
        </div>
      </div>

      {/* Main White Container: Toolbar + DocumentTable */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-5">
        {/* Toolbar: Search, Filter, + Add Fleet CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Title + Count */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              All Fleet Vehicles
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
                placeholder="Search by vehicle no, model, driver, or type..."
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

            {/* Status Filter Dropdown */}
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
                    ? "Filter Status"
                    : statusFilter === "active"
                    ? "Active"
                    : statusFilter === "in_transit"
                    ? "In Transit"
                    : statusFilter === "maintenance"
                    ? "Maintenance"
                    : "Inactive"}
                </span>
                {statusFilter !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-30 animate-dropdown">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Filter by Status
                  </div>
                  {[
                    { id: "all", label: "All Vehicles" },
                    { id: "active", label: "Active / Ready" },
                    { id: "in_transit", label: "In Transit" },
                    { id: "maintenance", label: "In Maintenance" },
                    { id: "inactive", label: "Inactive" },
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

            {/* + Add New Fleet CTA Button */}
            <button
              type="button"
              onClick={onClickAddFleet}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add New Fleet</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(statusFilter !== "all" || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-400">Active filters:</span>
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span>Status: {statusFilter}</span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="text-blue-500 hover:text-blue-800"
                >
                  <FiX className="w-3 h-3" />
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

        {/* Common DocumentTable for Fleet records */}
        <DocumentTable
          rows={finalDisplayData}
          headCells={fleetTableHeadCells}
          onClickEdit={onClickEdit}
          selected={selected}
          setSelected={setSelected}
          onClickDelete={(ids) => {
            setSelected(Array.isArray(ids) ? ids : [ids]);
            setDeletePopup(true);
          }}
          searchTerm={searchTerm}
          rowsPerPageOptions={[5, 10, 25, 50]}
          isLoading={isLoading}
        />
      </div>

      {/* Add / Edit Fleet Modal */}
      <CommonModal
        modalTitle={isEdit ? "Edit Fleet Vehicle" : "Add New Fleet Vehicle"}
        modalOpen={fleetModal}
        setModalOpen={setFleetModal}
        modalSize="w-11/12 md:w-[680px]"
      >
        <FleetForm
          setFleetList={setFleetList}
          modalData={modalData}
          isEdit={isEdit}
          toggleModal={() => setFleetModal(false)}
          onClose={() => setFleetModal(false)}
        />
      </CommonModal>

      {/* Delete Confirmation Modal */}
      <CommonModal
        modalTitle="Delete Fleet Vehicle"
        modalOpen={deletePopup}
        setModalOpen={setDeletePopup}
        modalSize="w-11/12 sm:w-96"
      >
        <div className="p-5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Delete Fleet Vehicle{selected.length > 1 ? "s" : ""}?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete {selected.length > 1 ? `${selected.length} selected vehicles` : "this fleet vehicle"}? This action cannot be undone.
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
