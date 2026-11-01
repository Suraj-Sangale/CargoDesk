import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import FleetHeader from "./fleetHeader";
import FleetTabs from "./fleetTabs";
import FleetSummaryCard from "./fleetSummaryCard";
import ActivityHistory from "./activityHistory";
import {
  OverviewPanel,
  DocumentsPanel,
  EmiPanel,
  DriverPanel,
  MaintenancePanel,
} from "./tabs/tabPanels";
import CommonModal from "../common/commonModal";
import FleetForm from "../fleets/fleetForm";
import AddDocumentForm from "../common/molecules/addDocumentForm";
import CustomSearch from "../common/customSearch";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { useFleetDriver } from "@/context/fleetDriverContext";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiUser,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { HiOutlineTruck } from "react-icons/hi";
import { ImSpinner9 } from "react-icons/im";
import Link from "next/link";

export default function FleetDetailsWrapper({
  initialFleet = null,
  initialHistory = [],
  initialSummary = {},
}) {
  const router = useRouter();
  const { fleetId } = router.query;
  const { refreshAll, assignDriverToFleet, removeDriverFromFleet, drivers } =
    useFleetDriver() || {};

  const [fleet, setFleet] = useState(initialFleet);
  const [activeTab, setActiveTab] = useState("history"); // Defaults to Activity History as primary view
  const [loading, setLoading] = useState(!initialFleet && Boolean(fleetId));
  const [error, setError] = useState(!initialFleet && !fleetId ? "Invalid fleet ID" : null);

  // Modals state
  const [summaryCollapsedMobile, setSummaryCollapsedMobile] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [addDocLoading, setAddDocLoading] = useState(false);
  const [assignDriverModalOpen, setAssignDriverModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Fetch fleet details if not provided via SSR
  const fetchFleetDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await postApiData("GET_FLEET_BY_ID", { id });
      if (result?.status && result?.data) {
        setFleet(result.data);
      } else {
        setError(result?.message || "Fleet vehicle not found");
      }
    } catch (err) {
      console.error("Error fetching fleet by ID:", err);
      setError("Failed to load fleet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFleet) {
      setFleet(initialFleet);
    }
  }, [initialFleet]);

  useEffect(() => {
    if (!initialFleet && fleetId) {
      fetchFleetDetails(fleetId);
    }
  }, [fleetId, initialFleet]);

  // Handle vehicle status change (e.g. Active <-> Maintenance)
  const handleStatusChange = async (newStatus) => {
    if (!fleet?.id) return;
    const previousStatus = fleet.status;
    // Optimistic UI update
    setFleet((prev) => ({ ...prev, status: newStatus }));

    try {
      const res = await postApiData("UPDATE_FLEET", {
        id: fleet.id,
        status: newStatus,
        performedByName: "Admin User",
      });

      if (res?.status) {
        showToast({ message: `Fleet status updated to ${newStatus}`, type: "success" });
        if (refreshAll) refreshAll();
        // Refresh fleet details and activity
        fetchFleetDetails(fleet.id);
      } else {
        // Revert on failure
        setFleet((prev) => ({ ...prev, status: previousStatus }));
        showToast({ message: res?.message || "Failed to update status", type: "error" });
      }
    } catch (err) {
      setFleet((prev) => ({ ...prev, status: previousStatus }));
      showToast({ message: "Error updating status", type: "error" });
    }
  };

  // Callback after adding a document
  const handleAddDocumentSuccess = (data) => {
    setAddDocLoading(true);
    postApiData("ADD_NEW_VEHICALE_DOCUMENTS", {
      ...data,
      fleet_id: fleet?.id,
      fleetId: fleet?.id,
      vehicleNo: fleet?.vehicle_number,
    })
      .then((res) => {
        if (res?.status || res?.success) {
          showToast({ message: "Document added successfully", type: "success" });
          setDocModalOpen(false);
          if (refreshAll) refreshAll();
          if (fleet?.id) {
            fetchFleetDetails(fleet.id);
          }
        } else {
          showToast({ message: res?.message || "Failed to add document", type: "error" });
        }
      })
      .catch((err) => {
        console.error("Error adding document:", err);
        showToast({ message: "Failed to add document", type: "error" });
      })
      .finally(() => {
        setAddDocLoading(false);
      });
  };

  // Driver options for assign modal
  const driverSelectOptions = React.useMemo(() => {
    if (!drivers || !Array.isArray(drivers)) return [];
    return drivers.map((d) => {
      const isCurrent = Number(d.fleet_id) === Number(fleet?.id);
      const isElsewhere = d.fleet_id && !isCurrent;
      return {
        value: String(d.id),
        label: `${d.driver_name} (${d.contact_number || "No Contact"})${
          isCurrent
            ? " [Currently Assigned]"
            : isElsewhere
            ? ` [Assigned: ${d.assigned_vehicle || "Vehicle"}]`
            : " [Available]"
        }`,
      };
    });
  }, [drivers, fleet?.id]);

  // Handle direct driver assignment from modal
  const handleConfirmDriverAssignment = async () => {
    if (!selectedDriverId) {
      showToast({ message: "Please select a driver to assign", type: "error" });
      return;
    }
    setAssigningLoading(true);
    try {
      const res = await assignDriverToFleet(fleet?.id, selectedDriverId);
      if (res?.status) {
        setAssignDriverModalOpen(false);
        if (fleet?.id) {
          await fetchFleetDetails(fleet.id);
        }
      }
    } finally {
      setAssigningLoading(false);
    }
  };

  // Handle unassigning driver
  const handleUnassignDriver = async () => {
    setAssigningLoading(true);
    try {
      const res = await removeDriverFromFleet({
        fleetId: fleet?.id,
        driverId: fleet?.driver_id,
      });
      if (res?.status) {
        if (fleet?.id) {
          await fetchFleetDetails(fleet.id);
        }
      }
    } finally {
      setAssigningLoading(false);
    }
  };

  // If fleet not found error state
  if (error && !loading) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Fleet Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
          The fleet you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/fleets"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Go to Fleet</span>
        </Link>
      </div>
    );
  }

  // Skeleton loading state for overall page
  if (loading && !fleet) {
    return (
      <div className="py-6 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-slate-200" />
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Top Fleet Header with Breadcrumbs and Action Buttons */}
      <FleetHeader
        fleet={fleet}
        onEditFleet={() => setEditModalOpen(true)}
        onAddDocument={() => setDocModalOpen(true)}
        onStatusChange={handleStatusChange}
      />

      {/* Navigation Tabs Bar */}
      <FleetTabs
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        counts={fleet?.counts || {}}
      />

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Persistent Fleet Summary Card (Collapsible by default on mobile/responsive, sticky on desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-6 z-10 space-y-2">
          {/* Mobile Summary Accordion Trigger (Visible only on mobile/tablet < lg) */}
          <button
            type="button"
            onClick={() => setSummaryCollapsedMobile((prev) => !prev)}
            aria-expanded={!summaryCollapsedMobile}
            className="lg:hidden w-full bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer hover:border-slate-300"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <HiOutlineTruck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {fleet?.vehicle_number || "Vehicle Details"}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      (fleet?.status || "Active").toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : (fleet?.status || "").toLowerCase() === "maintenance"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {fleet?.status || "Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {fleet?.vehicle_model || "Fleet Vehicle"} {fleet?.vehicle_type ? `• ${fleet.vehicle_type}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 shrink-0 bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100">
              <span>{summaryCollapsedMobile ? "View Details" : "Hide Details"}</span>
              {summaryCollapsedMobile ? (
                <FiChevronDown className="w-4 h-4 transition-transform" />
              ) : (
                <FiChevronUp className="w-4 h-4 transition-transform" />
              )}
            </div>
          </button>

          {/* Fleet Summary Card Content (Collapsible on mobile < lg, always visible on desktop lg:) */}
          <div className={`${summaryCollapsedMobile ? "hidden lg:block" : "block"} transition-all`}>
            <FleetSummaryCard
              fleet={fleet}
              onEditPhoto={() => setEditModalOpen(true)}
            />

            {/* Quick Collapse Button at bottom when expanded on mobile */}
            {!summaryCollapsedMobile && (
              <button
                type="button"
                onClick={() => setSummaryCollapsedMobile(true)}
                className="lg:hidden w-full mt-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100/70 hover:bg-slate-100 rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiChevronUp className="w-3.5 h-3.5" />
                <span>Collapse Vehicle Summary</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Tab Content / Activity History */}
        <div className="lg:col-span-8 xl:col-span-8 min-w-0">
          {activeTab === "history" && (
            <ActivityHistory
              fleetId={fleet?.id}
              vehicleNo={fleet?.vehicle_number}
              initialData={initialHistory}
              initialSummary={initialSummary}
            />
          )}

          {activeTab === "overview" && (
            <OverviewPanel
              fleet={fleet}
              onNavigateTab={(t) => setActiveTab(t)}
              onAddDocument={() => setDocModalOpen(true)}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsPanel
              fleet={fleet}
              onAddDocument={() => setDocModalOpen(true)}
            />
          )}

          {activeTab === "emi" && <EmiPanel fleet={fleet} />}

          {activeTab === "driver" && (
            <DriverPanel
              fleet={fleet}
              onAssignDriver={() => {
                setSelectedDriverId(fleet?.driver_id ? String(fleet.driver_id) : "");
                setAssignDriverModalOpen(true);
              }}
              onUnassignDriver={handleUnassignDriver}
            />
          )}

          {activeTab === "maintenance" && (
            <MaintenancePanel fleet={fleet} onRefreshFleet={fetchFleetDetails} />
          )}

          {activeTab === "insurance" && (
            <DocumentsPanel
              fleet={fleet}
              onAddDocument={() => setDocModalOpen(true)}
            />
          )}

          {activeTab === "gps" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-slate-500 text-sm">
              <p>GPS Tracking ID: <strong>{fleet?.gps_tracking_id || "GPS-TRK-5678"}</strong></p>
              <p className="text-xs text-slate-400 mt-1">Live telematics and route tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Fleet Modal */}
      {editModalOpen && (
        <CommonModal
          modalOpen={editModalOpen}
          setModalOpen={setEditModalOpen}
          modalTitle="Edit Fleet Vehicle"
          modalSize="w-11/12 md:w-[650px]"
        >
          <FleetForm
            isEdit={true}
            modalData={fleet}
            setFleetList={(list) => {
              if (fleet?.id) fetchFleetDetails(fleet.id);
            }}
            onClose={() => {
              setEditModalOpen(false);
              if (fleet?.id) fetchFleetDetails(fleet.id);
            }}
            toggleModal={() => setEditModalOpen(false)}
          />
        </CommonModal>
      )}

      {/* Add Document Modal */}
      {docModalOpen && (
        <CommonModal
          modalOpen={docModalOpen}
          setModalOpen={setDocModalOpen}
          modalTitle={`Add Document for ${fleet?.vehicle_number || "Vehicle"}`}
          modalSize="w-11/12 md:w-[500px]"
        >
          <AddDocumentForm
            isEdit={false}
            reminderData={{
              vehicleNo: fleet?.vehicle_number || "",
              fleetId: fleet?.id,
            }}
            addReminderData={handleAddDocumentSuccess}
            setReminderModal={setDocModalOpen}
            isLoading={addDocLoading}
          />
        </CommonModal>
      )}

      {/* Direct Assign Driver Modal */}
      {assignDriverModalOpen && (
        <CommonModal
          modalOpen={assignDriverModalOpen}
          setModalOpen={setAssignDriverModalOpen}
          modalTitle={`Assign Driver to ${fleet?.vehicle_number || "Vehicle"}`}
          modalSize="w-11/12 md:w-[480px]"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <FiUser className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Transport Driver Allocation
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select a certified driver to assign as the primary operator of {fleet?.vehicle_number}.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Driver
              </label>
              <CustomSearch
                name="assign_driver"
                value={selectedDriverId}
                selectedValue={selectedDriverId}
                options={driverSelectOptions}
                placeholder="Search by driver name or contact number..."
                onChange={(opt) => {
                  const val = opt?.value !== undefined ? opt.value : opt || "";
                  setSelectedDriverId(val ? String(val) : "");
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignDriverModalOpen(false)}
                disabled={assigningLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDriverAssignment}
                disabled={assigningLoading || !selectedDriverId}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {assigningLoading ? (
                  <>
                    <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </CommonModal>
      )}
    </div>
  );
}
