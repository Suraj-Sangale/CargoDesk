import executeQuery, { executeTransaction } from "@/helpers/dbConnection";
import { logFleetActivity } from "./fleetActivityModel";

export function getAllFleetsModel() {
  return new Promise(async (resolve, reject) => {
    try {
      const selectQuery = `
        SELECT 
          f.*,
          d.id AS driver_id,
          d.driver_name AS driver_name,
          d.contact_number AS driver_contact,
          d.license_number AS driver_license_number,
          d.license_type AS driver_license_type,
          d.status AS driver_status,
          d.profile_photo AS driver_profile_photo
        FROM fleets f
        LEFT JOIN drivers d ON d.fleet_id = f.id
        ORDER BY f.id DESC
      `;
      const rows = await executeQuery(selectQuery);
      resolve({
        status: true,
        data: Array.isArray(rows) ? rows : [],
        message: "Fleets fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching fleets:", error);
      // Fallback to empty array if db fails
      resolve({
        status: true,
        data: [],
        message: "Fleets retrieved from fallback dataset",
      });
    }
  });
}

export function getFleetByIdModel(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const fleetId = Number(id);
      if (!fleetId || isNaN(fleetId)) {
        return resolve({ status: false, message: "Invalid fleet ID" });
      }

      const selectQuery = `
        SELECT 
          f.*,
          d.id AS driver_id,
          d.driver_name AS driver_name,
          d.contact_number AS driver_contact,
          d.license_number AS driver_license_number,
          d.license_type AS driver_license_type,
          d.status AS driver_status,
          d.profile_photo AS driver_profile_photo
        FROM fleets f
        LEFT JOIN drivers d ON d.fleet_id = f.id
        WHERE f.id = ?
        LIMIT 1
      `;
      const rows = await executeQuery(selectQuery, [fleetId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return resolve({ status: false, message: "Fleet not found" });
      }

      const fleet = rows[0];

      const docQuery = `SELECT * FROM vehicle_documents WHERE fleet_id = ? OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = REPLACE(REPLACE(?, ' ', ''), '-', '') COLLATE utf8mb4_general_ci) ORDER BY id DESC`;
      const emiQuery = `SELECT * FROM emi_master WHERE (fleet_id IS NOT NULL AND fleet_id = ?) OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = REPLACE(REPLACE(?, ' ', ''), '-', '') COLLATE utf8mb4_general_ci) ORDER BY id DESC`;
      const driverQuery = `SELECT COUNT(*) AS total FROM drivers WHERE fleet_id = ?`;
      const maintQuery = `SELECT COUNT(*) AS total FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'MAINTENANCE'`;
      // Fetch dynamic records for tabs: Documents, EMI, Drivers, Maintenance
      const [docRows, emiRows, driverRes, maintRes] = await Promise.all([
        executeQuery(docQuery, [fleet.id, fleet.vehicle_number]).catch(
          () => [],
        ),

        executeQuery(emiQuery, [fleet.id, fleet.vehicle_number]).catch(
          () => [],
        ),

        executeQuery(driverQuery, [fleet.id]).catch(() => [{ total: 0 }]),

        executeQuery(maintQuery, [fleet.id]).catch(() => [{ total: 0 }]),
      ]);

      const documents = Array.isArray(docRows) ? docRows : [];
      const emis = Array.isArray(emiRows) ? emiRows : [];

      const counts = {
        documents: documents.length,
        emi: emis.length,
        driver: driverRes?.[0]?.total || (fleet.driver_id ? 1 : 0),
        maintenance:
          maintRes?.[0]?.total || (fleet.status === "Maintenance" ? 1 : 0),
      };

      // Auto-ensure driver assignment is recorded in activity history if driver is linked
      if (fleet.driver_id && fleet.driver_name) {
        try {
          const existingDriverAct = await executeQuery(
            `SELECT id FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'DRIVER' LIMIT 1`,
            [fleet.id],
          );
          if (!existingDriverAct || existingDriverAct.length === 0) {
            await logFleetActivity({
              fleetId: fleet.id,
              operationType: "DRIVER",
              entityType: "DRIVER_ALLOCATION",
              entityId: String(fleet.driver_id),
              action: "ASSIGN",
              title: "Driver assigned",
              description: `Driver: ${fleet.driver_name}`,
              oldValue: null,
              newValue: {
                driver_id: fleet.driver_id,
                driver_name: fleet.driver_name,
              },
              changedFields: ["driver_id", "driver_name"],
              performedByName: "Admin User",
              source: "driver",
              metadata: {
                vehicle_number: fleet.vehicle_number,
                driver_name: fleet.driver_name,
              },
            });
          }
        } catch (syncErr) {
          console.warn("Could not sync driver activity:", syncErr?.message);
        }
      }

      // Auto-ensure documents are recorded in activity history if not already present
      if (Array.isArray(documents) && documents.length > 0) {
        try {
          const existingDocActs = await executeQuery(
            `SELECT entity_id FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'DOCUMENT'`,
            [fleet.id],
          );
          const loggedDocIds = new Set(
            (existingDocActs || []).map((a) => String(a.entity_id)),
          );
          for (const doc of documents) {
            if (doc.id && !loggedDocIds.has(String(doc.id))) {
              await logFleetActivity({
                fleetId: fleet.id,
                vehicleNo: fleet.vehicle_number,
                operationType: "DOCUMENT",
                entityType: (doc.documentType || "DOCUMENT").toUpperCase(),
                entityId: String(doc.id),
                action: "UPLOAD",
                title: `${doc.documentType || "Document"} uploaded`,
                description: doc.expiryDate
                  ? `Document expiry: ${moment(doc.expiryDate).format("DD MMM YYYY")}`
                  : `${doc.documentType || "Document"} uploaded for vehicle ${fleet.vehicle_number}`,
                oldValue: null,
                newValue: doc,
                changedFields: Object.keys(doc),
                performedByName: "Admin User",
                performedAt: doc.createdAt || doc.created_at || null,
                source: "documents",
                metadata: {
                  fleet_id: fleet.id,
                  vehicleNo: fleet.vehicle_number,
                  documentType: doc.documentType,
                  expiryDate: doc.expiryDate,
                },
              });
            }
          }
        } catch (docSyncErr) {
          console.warn("Could not sync doc activity:", docSyncErr?.message);
        }
      }

      // Auto-ensure EMIs are recorded in activity history if not already present
      if (Array.isArray(emis) && emis.length > 0) {
        try {
          const existingEmiActs = await executeQuery(
            `SELECT entity_id FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'EMI'`,
            [fleet.id],
          );
          const loggedEmiIds = new Set(
            (existingEmiActs || []).map((a) => String(a.entity_id)),
          );
          for (const emi of emis) {
            if (emi.id && !loggedEmiIds.has(String(emi.id))) {
              await logFleetActivity({
                fleetId: fleet.id,
                vehicleNo: fleet.vehicle_number,
                operationType: "EMI",
                entityType: "FINANCE_EMI",
                entityId: String(emi.id),
                action: "CREATE",
                title: "EMI record added",
                description: `Loan ${emi.loan_name || emi.bank_name || "Facility"} added (₹${emi.emi_amount || 0}/mo for vehicle ${fleet.vehicle_number})`,
                oldValue: null,
                newValue: emi,
                changedFields: Object.keys(emi),
                performedByName: "Admin User",
                performedAt: emi.created_at || emi.createdAt || null,
                source: "emi",
                metadata: {
                  fleet_id: fleet.id,
                  vehicle_number: fleet.vehicle_number,
                  loan_account_no: emi.loan_account_no,
                  bank_name: emi.bank_name,
                },
              });
            }
          }
        } catch (emiSyncErr) {
          console.warn("Could not sync emi activity:", emiSyncErr?.message);
        }
      }

      resolve({
        status: true,
        data: {
          ...fleet,
          documents,
          emis,
          counts,
        },
        message: "Fleet details fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching fleet by ID:", error);
      resolve({
        status: false,
        message: error?.message || "Failed to fetch fleet details",
      });
    }
  });
}

export function addNewFleetModel(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        vehicle_number,
        vehicle_model,
        vehicle_type,
        capacity,
        fuel_type,
        ownership_type,
        manufacturing_year,
        gps_tracking_id,
        chassis_number,
        engine_number,
        status,
        notes,
        driver_id,
      } = data;

      const parsedDriverId =
        driver_id !== undefined &&
        driver_id !== null &&
        driver_id !== "" &&
        Number(driver_id) > 0
          ? Number(driver_id)
          : null;

      const payload = {
        vehicle_number: vehicle_number
          ? vehicle_number.toUpperCase().trim()
          : null,
        vehicle_model: vehicle_model || null,
        vehicle_type: vehicle_type || null,
        capacity: capacity || null,
        fuel_type: fuel_type || null,
        ownership_type: ownership_type || null,
        manufacturing_year: manufacturing_year || null,
        gps_tracking_id: gps_tracking_id || null,
        chassis_number: chassis_number || null,
        engine_number: engine_number || null,
        status: status || "Active",
        notes: notes || null,
      };

      const result = await executeTransaction(async (queryFn) => {
        const insertRes = await queryFn(`INSERT INTO fleets SET ?`, payload);
        const newFleetId = insertRes.insertId;

        // If driver was selected, update driver.fleet_id
        if (parsedDriverId && newFleetId) {
          // Unassign any driver previously on this new fleet (just in case)
          await queryFn(
            `UPDATE drivers SET fleet_id = NULL WHERE fleet_id = ?`,
            [newFleetId],
          );
          // Assign selected driver to this fleet
          await queryFn(`UPDATE drivers SET fleet_id = ? WHERE id = ?`, [
            newFleetId,
            parsedDriverId,
          ]);
        }

        return insertRes;
      });

      if (result && result.affectedRows > 0) {
        const newFleetId = result.insertId;
        // Centralized Fleet Activity Logging: Registration
        await logFleetActivity({
          fleetId: newFleetId,
          operationType: "FLEET",
          entityType: "VEHICLE_INFO",
          entityId: String(newFleetId),
          action: "CREATE",
          title: "Fleet vehicle registered",
          description: `Vehicle ${payload.vehicle_number} (${payload.vehicle_model || payload.vehicle_type || "Commercial"}) registered to fleet`,
          oldValue: null,
          newValue: payload,
          changedFields: Object.keys(payload),
          performedByName: data.performedByName || "Admin User",
          source: "fleets",
          metadata: {
            vehicle_number: payload.vehicle_number,
            model: payload.vehicle_model,
          },
        });

        // Activity Logging: Driver Assignment during registration
        if (parsedDriverId) {
          await logFleetActivity({
            fleetId: newFleetId,
            operationType: "DRIVER",
            entityType: "DRIVER_ALLOCATION",
            entityId: String(parsedDriverId),
            action: "ASSIGN",
            title: "Driver assigned on registration",
            description: `Driver (ID: ${parsedDriverId}) assigned to vehicle ${payload.vehicle_number}`,
            oldValue: null,
            newValue: { driver_id: parsedDriverId },
            changedFields: ["driver_id"],
            performedByName: data.performedByName || "Admin User",
            source: "fleet-driver",
          });
        }

        resolve({
          status: true,
          id: result.insertId,
          message: "Fleet vehicle added successfully",
        });
      } else {
        resolve({
          status: false,
          message: "Failed to add fleet vehicle.",
        });
      }
    } catch (error) {
      console.error("Error adding fleet:", error);
      if (error.code === "ER_DUP_ENTRY") {
        resolve({
          status: false,
          message:
            "A vehicle with this registration number already exists in your fleet.",
        });
      } else {
        resolve({
          status: false,
          message: "Database error while adding fleet vehicle.",
        });
      }
    }
  });
}

export function updateFleetModel(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      // await ensureFleetTable();

      const parsedDriverId =
        data.driver_id !== undefined
          ? data.driver_id !== null &&
            data.driver_id !== "" &&
            Number(data.driver_id) > 0
            ? Number(data.driver_id)
            : null
          : undefined;

      const updateData = {
        vehicle_number: data.vehicle_number
          ? data.vehicle_number.toUpperCase().trim()
          : undefined,
        vehicle_model: data.vehicle_model,
        vehicle_type: data.vehicle_type,
        capacity: data.capacity,
        fuel_type: data.fuel_type,
        ownership_type: data.ownership_type,
        manufacturing_year: data.manufacturing_year,
        gps_tracking_id: data.gps_tracking_id,
        chassis_number: data.chassis_number,
        engine_number: data.engine_number,
        status: data.status,
        notes: data.notes,
      };

      // Clean undefined keys
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      // Fetch old record and old driver for diffing and audit trail
      const oldRows = await executeQuery(`SELECT * FROM fleets WHERE id = ?`, [
        id,
      ]);
      const oldFleet =
        Array.isArray(oldRows) && oldRows.length > 0 ? oldRows[0] : null;

      const oldDriverRows = await executeQuery(
        `SELECT id, driver_name FROM drivers WHERE fleet_id = ?`,
        [id],
      );
      const oldDriver =
        Array.isArray(oldDriverRows) && oldDriverRows.length > 0
          ? oldDriverRows[0]
          : null;

      await executeTransaction(async (queryFn) => {
        if (Object.keys(updateData).length > 0) {
          await queryFn(`UPDATE fleets SET ? WHERE id = ?`, [updateData, id]);
        }

        // Manage driver assignment if provided in update payload
        if (parsedDriverId !== undefined) {
          const targetVehNo = updateData.vehicle_number || oldFleet?.vehicle_number || null;
          if (parsedDriverId) {
            // Remove previous driver on this fleet (if different)
            await queryFn(
              `UPDATE drivers SET fleet_id = NULL, assigned_vehicle = NULL WHERE fleet_id = ? AND id != ?`,
              [id, parsedDriverId],
            );
            // Assign selected driver to this fleet
            await queryFn(
              `UPDATE drivers SET fleet_id = ?, assigned_vehicle = ? WHERE id = ?`,
              [id, targetVehNo, parsedDriverId],
            );
          } else {
            // Unassign whoever was on this fleet
            await queryFn(
              `UPDATE drivers SET fleet_id = NULL, assigned_vehicle = NULL WHERE fleet_id = ?`,
              [id],
            );
          }
        }
      });

      // Centralized Activity Logging for Fleet Update
      if (oldFleet) {
        // Status change specific audit log
        if (updateData.status && updateData.status !== oldFleet.status) {
          await logFleetActivity({
            fleetId: id,
            operationType: "STATUS",
            entityType: "STATUS_CHANGE",
            entityId: String(id),
            action: updateData.status === "Active" ? "ACTIVATE" : "UPDATE",
            title: "Vehicle status changed",
            description: `${oldFleet.status} → ${updateData.status}`,
            oldValue: { status: oldFleet.status },
            newValue: { status: updateData.status },
            changedFields: ["status"],
            performedByName: data.performedByName || "Admin User",
            source: "fleets",
          });
        }

        // Driver Assignment Change Audit Log
        if (
          parsedDriverId !== undefined &&
          parsedDriverId !== (oldDriver?.id || null)
        ) {
          if (parsedDriverId) {
            const newDriverRows = await executeQuery(
              `SELECT id, driver_name FROM drivers WHERE id = ?`,
              [parsedDriverId],
            );
            const newDriverName =
              newDriverRows?.[0]?.driver_name || `Driver #${parsedDriverId}`;
            await logFleetActivity({
              fleetId: id,
              operationType: "DRIVER",
              entityType: "DRIVER_ALLOCATION",
              entityId: String(parsedDriverId),
              action: "ASSIGN",
              title: "Driver assigned",
              description: `Driver: ${newDriverName}`,
              oldValue: oldDriver
                ? {
                    driver_id: oldDriver.id,
                    driver_name: oldDriver.driver_name,
                  }
                : null,
              newValue: {
                driver_id: parsedDriverId,
                driver_name: newDriverName,
              },
              changedFields: ["driver_id", "driver_name"],
              performedByName: data.performedByName || "Admin User",
              source: "fleet-driver",
            });
          } else if (oldDriver) {
            await logFleetActivity({
              fleetId: id,
              operationType: "DRIVER",
              entityType: "DRIVER_ALLOCATION",
              entityId: String(oldDriver.id),
              action: "UNASSIGN",
              title: "Driver removed",
              description: `${oldDriver.driver_name} unassigned from vehicle`,
              oldValue: {
                driver_id: oldDriver.id,
                driver_name: oldDriver.driver_name,
              },
              newValue: null,
              changedFields: ["driver_id"],
              performedByName: data.performedByName || "Admin User",
              source: "fleet-driver",
            });
          }
        }

        // General Fleet Vehicle Details Update
        const hasOtherChanges = Object.keys(updateData).some(
          (k) =>
            k !== "status" &&
            String(oldFleet[k] ?? "") !== String(updateData[k] ?? ""),
        );

        if (hasOtherChanges) {
          await logFleetActivity({
            fleetId: id,
            operationType: "FLEET",
            entityType: "VEHICLE_DETAILS",
            entityId: String(id),
            action: "UPDATE",
            title: "Vehicle details updated",
            description: `Vehicle details updated for ${updateData.vehicle_number || oldFleet.vehicle_number}`,
            oldValue: oldFleet,
            newValue: { ...oldFleet, ...updateData },
            performedByName: data.performedByName || "Admin User",
            source: "fleets",
          });
        }
      }

      resolve({ status: true, message: "Fleet vehicle updated successfully" });
    } catch (error) {
      console.error("Error updating fleet:", error);
      if (error.code === "ER_DUP_ENTRY") {
        resolve({
          status: false,
          message: "A vehicle with this registration number already exists.",
        });
      } else {
        resolve({
          status: false,
          message: "Database error while updating fleet vehicle",
        });
      }
    }
  });
}

export function deleteFleetModel(ids) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return resolve({
          status: false,
          message: "No vehicle IDs provided for deletion",
        });
      }

      // Fetch fleet info before deletion for permanent audit logging
      const fleetRows = await executeQuery(
        `SELECT id, vehicle_number, vehicle_model FROM fleets WHERE id IN (?)`,
        [ids],
      );

      const result = await executeTransaction(async (queryFn) => {
        // Unassign any drivers assigned to the fleets being deleted
        await queryFn(
          `UPDATE drivers SET fleet_id = NULL WHERE fleet_id IN (?)`,
          [ids],
        );
        // Delete fleets
        const deleteRes = await queryFn(`DELETE FROM fleets WHERE id IN (?)`, [
          ids,
        ]);
        return deleteRes;
      });

      if (result.affectedRows > 0) {
        // Centralized Activity Logging for Fleet Deletion
        if (Array.isArray(fleetRows)) {
          for (const f of fleetRows) {
            await logFleetActivity({
              fleetId: f.id,
              operationType: "FLEET",
              entityType: "VEHICLE_INFO",
              entityId: String(f.id),
              action: "DELETE",
              title: "Fleet vehicle deleted",
              description: `Vehicle ${f.vehicle_number} (${f.vehicle_model || "Fleet vehicle"}) removed from fleet system`,
              oldValue: f,
              newValue: null,
              changedFields: ["deleted"],
              performedByName: "Admin User",
              source: "fleets",
            });
          }
        }

        resolve({
          status: true,
          message: `${result.affectedRows} fleet vehicle${result.affectedRows > 1 ? "s" : ""} deleted successfully`,
        });
      } else {
        resolve({
          status: false,
          message: "No fleet vehicles found with the given IDs",
        });
      }
    } catch (error) {
      console.error("Error deleting fleet:", error);
      resolve({
        status: false,
        message: "Database error while deleting fleet vehicle(s)",
      });
    }
  });
}
