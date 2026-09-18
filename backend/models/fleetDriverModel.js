import executeQuery, { executeTransaction } from "@/helpers/dbConnection";
import { ensureDriverTable } from "./driverModel";
import { ensureFleetTable } from "./fleetModel";

/**
 * Assign a driver to a fleet vehicle.
 * Ensures strict 1-to-1 relationship integrity via MySQL transaction.
 */
export function assignDriverToFleetModel(fleetId, driverId) {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureFleetTable();
      await ensureDriverTable();

      const fId = Number(fleetId);
      const dId = Number(driverId);

      if (!fId || isNaN(fId) || !dId || isNaN(dId)) {
        return resolve({
          status: false,
          message: "Valid numeric fleetId and driverId are required",
        });
      }

      // Check existence of fleet
      const fleetRows = await executeQuery(`SELECT id, vehicle_number FROM fleets WHERE id = ?`, [fId]);
      if (!fleetRows || fleetRows.length === 0) {
        return resolve({
          status: false,
          message: "Fleet vehicle not found with the provided ID",
        });
      }

      // Check existence of driver
      const driverRows = await executeQuery(`SELECT id, driver_name FROM drivers WHERE id = ?`, [dId]);
      if (!driverRows || driverRows.length === 0) {
        return resolve({
          status: false,
          message: "Driver not found with the provided ID",
        });
      }

      const fleet = fleetRows[0];
      const driver = driverRows[0];

      // Execute transaction to maintain 1-to-1 consistency
      await executeTransaction(async (queryFn) => {
        // 1. Remove any other driver assigned to this fleet
        await queryFn(`UPDATE drivers SET fleet_id = NULL WHERE fleet_id = ? AND id != ?`, [fId, dId]);

        // 2. Set this driver's fleet_id
        await queryFn(`UPDATE drivers SET fleet_id = ? WHERE id = ?`, [fId, dId]);
      });

      resolve({
        status: true,
        message: `Driver ${driver.driver_name} successfully assigned to vehicle ${fleet.vehicle_number}`,
        data: {
          fleetId: fId,
          driverId: dId,
          fleetVehicle: fleet.vehicle_number,
          driverName: driver.driver_name,
        },
      });
    } catch (error) {
      console.error("Error in assignDriverToFleetModel:", error);
      resolve({
        status: false,
        message: error?.message || "Database error while assigning driver to fleet",
      });
    }
  });
}

/**
 * Remove an existing driver-fleet assignment.
 */
export function removeDriverFromFleetModel({ driverId, fleetId }) {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureDriverTable();
      await ensureFleetTable();

      const dId = driverId ? Number(driverId) : null;
      const fId = fleetId ? Number(fleetId) : null;

      if (!dId && !fId) {
        return resolve({
          status: false,
          message: "Either driverId or fleetId must be provided to remove assignment",
        });
      }

      await executeTransaction(async (queryFn) => {
        if (dId) {
          await queryFn(`UPDATE drivers SET fleet_id = NULL WHERE id = ?`, [dId]);
        } else if (fId) {
          await queryFn(`UPDATE drivers SET fleet_id = NULL WHERE fleet_id = ?`, [fId]);
        }
      });

      resolve({
        status: true,
        message: "Fleet-Driver assignment removed successfully",
      });
    } catch (error) {
      console.error("Error in removeDriverFromFleetModel:", error);
      resolve({
        status: false,
        message: error?.message || "Database error while removing driver assignment",
      });
    }
  });
}
