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
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";
import { useFleetDriver } from "@/context/fleetDriverContext";
import { FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function FleetDetailsWrapper({
  initialFleet = null,
  initialHistory = [],
  initialSummary = {},
}) {
  const router = useRouter();
  const { fleetId } = router.query;
  const { refreshAll } = useFleetDriver() || {};

  const [fleet, setFleet] = useState(initialFleet);
  const [activeTab, setActiveTab] = useState("history"); // Defaults to Activity History as primary view
  const [loading, setLoading] = useState(!initialFleet && Boolean(fleetId));
  const [error, setError] = useState(!initialFleet && !fleetId ? "Invalid fleet ID" : null);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [addDocLoading, setAddDocLoading] = useState(false);

  // Fetch fleet details if not provided via SSR
  const fetchFleetDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fleet/get-by-id?id=${id}`);
      const result = await res.json();
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
        {/* Left Column: Persistent Fleet Summary Card (35-40% width on desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 sticky top-6 z-10">
          <FleetSummaryCard
            fleet={fleet}
            onEditPhoto={() => setEditModalOpen(true)}
          />
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

          {activeTab === "driver" && <DriverPanel fleet={fleet} />}

          {activeTab === "maintenance" && <MaintenancePanel fleet={fleet} />}

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
    </div>
  );
}
