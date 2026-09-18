import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";

const FleetDriverContext = createContext(null);

export function FleetDriverProvider({ children, initialFleets = [], initialDrivers = [] }) {
  const [fleets, setFleets] = useState(initialFleets);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fleets from backend API
  const refreshFleets = useCallback(async () => {
    try {
      const res = await postApiData("GET_ALL_FLEETS");
      if (res?.status && Array.isArray(res.data)) {
        setFleets(res.data);
        return res.data;
      }
    } catch (err) {
      console.error("Error refreshing fleets in context:", err);
    }
    return [];
  }, []);

  // Fetch drivers from backend API
  const refreshDrivers = useCallback(async () => {
    try {
      const res = await postApiData("GET_ALL_DRIVERS");
      if (res?.status && Array.isArray(res.data)) {
        setDrivers(res.data);
        return res.data;
      }
    } catch (err) {
      console.error("Error refreshing drivers in context:", err);
    }
    return [];
  }, []);

  // Refresh both datasets concurrently
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshFleets(), refreshDrivers()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshFleets, refreshDrivers]);

  // Initial fetch if not provided via SSR
  useEffect(() => {
    if (fleets.length === 0 && drivers.length === 0) {
      refreshAll();
    }
  }, []);

  // Helper selector: Get assigned driver for a fleet
  const getAssignedDriver = useCallback(
    (fleetId) => {
      if (!fleetId) return null;
      return drivers.find((d) => Number(d.fleet_id) === Number(fleetId)) || null;
    },
    [drivers]
  );

  // Helper selector: Get assigned fleet for a driver
  const getAssignedFleet = useCallback(
    (driverId) => {
      if (!driverId) return null;
      const driver = drivers.find((d) => Number(d.id) === Number(driverId));
      if (!driver || !driver.fleet_id) return null;
      return fleets.find((f) => Number(f.id) === Number(driver.fleet_id)) || null;
    },
    [drivers, fleets]
  );

  // Helper selector: Get available drivers (unassigned OR currently assigned to this fleet)
  const getAvailableDrivers = useCallback(
    (currentFleetId) => {
      return drivers.filter((d) => {
        if (!d.fleet_id) return true; // Unassigned
        if (currentFleetId && Number(d.fleet_id) === Number(currentFleetId)) return true; // Currently on this fleet
        return false;
      });
    },
    [drivers]
  );

  // Helper selector: Get available fleets (unassigned OR currently assigned to this driver)
  const getAvailableFleets = useCallback(
    (currentDriverId) => {
      const currentDriver = drivers.find((d) => Number(d.id) === Number(currentDriverId));
      const currentFleetId = currentDriver ? currentDriver.fleet_id : null;

      // Find all fleet IDs that are already taken by other drivers
      const assignedFleetIds = new Set(
        drivers
          .filter((d) => d.fleet_id && Number(d.id) !== Number(currentDriverId))
          .map((d) => Number(d.fleet_id))
      );

      return fleets.filter((f) => {
        if (currentFleetId && Number(f.id) === Number(currentFleetId)) return true;
        return !assignedFleetIds.has(Number(f.id));
      });
    },
    [drivers, fleets]
  );

  // Assign driver to fleet via API with synchronized state update
  const assignDriverToFleet = useCallback(
    async (fleetId, driverId) => {
      if (!fleetId) {
        showToast("Fleet ID is required to assign driver", "error");
        return { status: false };
      }

      setIsLoading(true);
      try {
        const response = await postApiData("ASSIGN_FLEET_DRIVER", {
          fleetId: Number(fleetId),
          driverId: driverId ? Number(driverId) : null,
        });

        if (response && response.status) {
          showToast(response.message || "Driver assigned successfully", "success");
          // Refresh both datasets to ensure complete synchronization
          await Promise.all([refreshFleets(), refreshDrivers()]);
          return { status: true, data: response.data };
        } else {
          showToast(response?.message || "Failed to assign driver", "error");
          return { status: false, message: response?.message };
        }
      } catch (err) {
        console.error("Error assigning driver to fleet:", err);
        showToast("Error occurred during driver assignment", "error");
        return { status: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshFleets, refreshDrivers]
  );

  // Remove assignment via API with synchronized state update
  const removeDriverFromFleet = useCallback(
    async ({ driverId, fleetId }) => {
      setIsLoading(true);
      try {
        const response = await postApiData("REMOVE_FLEET_DRIVER", {
          driverId: driverId ? Number(driverId) : null,
          fleetId: fleetId ? Number(fleetId) : null,
        });

        if (response && response.status) {
          showToast(response.message || "Assignment removed successfully", "success");
          await Promise.all([refreshFleets(), refreshDrivers()]);
          return { status: true };
        } else {
          showToast(response?.message || "Failed to remove assignment", "error");
          return { status: false, message: response?.message };
        }
      } catch (err) {
        console.error("Error removing assignment:", err);
        showToast("Error occurred while removing assignment", "error");
        return { status: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshFleets, refreshDrivers]
  );

  const contextValue = {
    fleets,
    setFleets,
    drivers,
    setDrivers,
    isLoading,
    refreshFleets,
    refreshDrivers,
    refreshAll,
    assignDriverToFleet,
    removeDriverFromFleet,
    getAssignedDriver,
    getAssignedFleet,
    getAvailableDrivers,
    getAvailableFleets,
  };

  return (
    <FleetDriverContext.Provider value={contextValue}>
      {children}
    </FleetDriverContext.Provider>
  );
}

export function useFleetDriver() {
  const context = useContext(FleetDriverContext);
  if (!context) {
    throw new Error("useFleetDriver must be used within a FleetDriverProvider");
  }
  return context;
}
