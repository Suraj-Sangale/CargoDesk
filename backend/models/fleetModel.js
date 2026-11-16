import executeQuery, { executeTransaction } from "@/helpers/dbConnection";
import { logFleetActivity, syncFleetMaintenanceActivities } from "./fleetActivityModel";

export function getAllFleetsModel(requestOrUser = {}, authUser = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Resolve request payload and authUser whether passed as:
      //    - getAllFleetsModel(request, authUser) -> API route
      //    - getAllFleetsModel({}, user)          -> SSR with user as 2nd arg
      //    - getAllFleetsModel(user)              -> SSR with user as sole arg
      let request = {};
      let user = null;

      if (authUser) {
        request = requestOrUser || {};
        user = authUser;
      } else if (requestOrUser?.user) {
        user = requestOrUser.user;
        request = requestOrUser;
      } else if (requestOrUser?.userId || requestOrUser?.role) {
        user = requestOrUser;
        request = {};
      } else {
        request = requestOrUser || {};
      }

      let orgId = user?.orgId ? Number(user.orgId) : null;
      if (!orgId && user?.userId) {
        const uRows = await executeQuery(
          "SELECT orgId FROM users WHERE userId = ? LIMIT 1",
          [user.userId],
        );
        if (uRows?.[0]?.orgId) {
          orgId = Number(uRows[0].orgId);
        }
      }

      const isSuperAdmin =
        user?.role === "super_admin" || user?.email === "suraj@agnibyte.com";

      const whereClauses = [];
      const params = [];

      // Multi-tenant organization scoping
      if (!isSuperAdmin) {
        if (orgId) {
          whereClauses.push("f.orgId = ? ");
          // whereClauses.push("(f.orgId = ? OR f.orgId IS NULL)");
          params.push(orgId);
        } else {
          whereClauses.push("f.orgId IS NULL");
        }
      } else if (request?.orgId) {
        whereClauses.push("f.orgId = ?");
        params.push(Number(request.orgId));
      }

      const whereSQL =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const selectQuery = `
        SELECT 
          f.*,
          o.orgName AS organization_name,
          o.orgName AS orgName,
          o.orgCode AS orgCode,
          d.id AS driver_id,
          d.driver_name AS driver_name,
          d.contact_number AS driver_contact,
          d.license_number AS driver_license_number,
          d.license_type AS driver_license_type,
          d.status AS driver_status,
          d.profile_photo AS driver_profile_photo
        FROM fleets f
        LEFT JOIN organizations o ON o.orgId = f.orgId
        LEFT JOIN drivers d ON d.fleet_id = f.id
        ${whereSQL}
        ORDER BY f.id DESC
      `;
      const rows = await executeQuery(selectQuery, params);
      const processedRows = (Array.isArray(rows) ? rows : []).map((row, idx) => ({
        ...row,
        sr_no: idx + 1,
      }));
      resolve({
        status: true,
        data: processedRows,
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
          o.orgName AS organization_name,
          o.orgName AS orgName,
          o.orgCode AS orgCode,
          d.id AS driver_id,
          d.driver_name AS driver_name,
          d.contact_number AS driver_contact,
          d.license_number AS driver_license_number,
          d.license_type AS driver_license_type,
          d.status AS driver_status,
          d.profile_photo AS driver_profile_photo
        FROM fleets f
        LEFT JOIN organizations o ON o.orgId = f.orgId
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
      const maintQuery = `SELECT COUNT(*) AS total FROM fleet_maintenance WHERE vehicle_id = ?`;
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

      // Auto-ensure maintenance records are recorded in activity history if not already present
      try {
        await syncFleetMaintenanceActivities(fleet.id);
      } catch (maintSyncErr) {
        console.warn("Could not sync maintenance activity:", maintSyncErr?.message);
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

export function addNewFleetModel(data, authUser = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Resolve Organization ID securely from server session
      let orgId = authUser?.orgId ? Number(authUser.orgId) : null;

      if (!orgId && authUser?.userId) {
        const uRows = await executeQuery(
          "SELECT orgId FROM users WHERE userId = ? LIMIT 1",
          [authUser.userId],
        );
        if (uRows?.[0]?.orgId) {
          orgId = Number(uRows[0].orgId);
        }
      }

      const isSuperAdmin =
        authUser?.role === "super_admin" ||
        authUser?.email === "suraj@agnibyte.com";

      // 2. Organization Validation:
      // Super Admin can assign fleet to an organization via orgId / organization_id
      // Non-Super Admin MUST belong to an organization and cannot spoof/override it
      const targetOrg = data?.orgId || data?.organization_id || data?.org_id;
      if (isSuperAdmin) {
        if (targetOrg && Number(targetOrg) > 0) {
          orgId = Number(targetOrg);
        }
      } else {
        if (!orgId) {
          return resolve({
            status: false,
            message: "Organization ID is required. Your user account is not associated with an organization.",
          });
        }
      }

      // If orgId is resolved, verify the organization exists
      if (orgId) {
        const orgRows = await executeQuery(
          "SELECT orgId, status FROM organizations WHERE orgId = ? LIMIT 1",
          [orgId]
        );
        if (!orgRows || orgRows.length === 0) {
          return resolve({
            status: false,
            message: "The specified organization does not exist.",
          });
        }
      }

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

      // 3. Cross-tenant driver assignment validation
      if (parsedDriverId) {
        const driverRows = await executeQuery(
          "SELECT id, orgId, driver_name FROM drivers WHERE id = ? LIMIT 1",
          [parsedDriverId]
        );
        if (!driverRows || driverRows.length === 0) {
          return resolve({
            status: false,
            message: "Selected driver does not exist.",
          });
        }
        const driverRecord = driverRows[0];
        if (orgId && driverRecord.orgId && Number(driverRecord.orgId) !== Number(orgId)) {
          return resolve({
            status: false,
            message: "Cannot assign a driver belonging to a different organization.",
          });
        }
      }

      const payload = {
        orgId: orgId || null,
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

export function updateFleetModel(id, data, authUser = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Validate Fleet ID
      const fleetId = Number(id);

      if (!Number.isInteger(fleetId) || fleetId <= 0) {
        return resolve({
          status: false,
          message: "Invalid fleet ID.",
        });
      }

      // 2. Resolve Organization ID securely
      let orgId = authUser?.orgId ? Number(authUser.orgId) : null;

      if (!orgId && authUser?.userId) {
        const uRows = await executeQuery(
          "SELECT orgId FROM users WHERE userId = ? LIMIT 1",
          [authUser.userId]
        );

        if (uRows?.[0]?.orgId) {
          orgId = Number(uRows[0].orgId);
        }
      }

      const isSuperAdmin =
        authUser?.role === "super_admin" ||
        authUser?.email === "suraj@agnibyte.com";

      // 3. Fetch existing fleet
      const oldRows = await executeQuery(
        `SELECT * FROM fleets WHERE id = ? LIMIT 1`,
        [fleetId]
      );

      const oldFleet = oldRows?.[0] || null;

      if (!oldFleet) {
        return resolve({
          status: false,
          message: "Fleet vehicle not found.",
        });
      }

      // 4. Organization boundary validation
      if (!isSuperAdmin) {
        if (
          !orgId ||
          Number(oldFleet.orgId) !== Number(orgId)
        ) {
          return resolve({
            status: false,
            message:
              "Unauthorized: You cannot modify a fleet vehicle belonging to another organization.",
          });
        }
      }

      // 5. Super Admin organization update
      const orgFields = ["orgId", "organization_id", "org_id"];

      const orgField = orgFields.find((field) =>
        Object.prototype.hasOwnProperty.call(data, field)
      );

      let newOrgId = oldFleet.orgId;

      if (orgField) {
        if (!isSuperAdmin) {
          return resolve({
            status: false,
            message: "Only Super Admin can change fleet organization.",
          });
        }

        const rawOrgId = data[orgField];

        if (rawOrgId === null || rawOrgId === "") {
          return resolve({
            status: false,
            message: "Invalid organization ID.",
          });
        }

        newOrgId = Number(rawOrgId);

        if (!Number.isInteger(newOrgId) || newOrgId <= 0) {
          return resolve({
            status: false,
            message: "Invalid organization ID.",
          });
        }

        const organizationRows = await executeQuery(
          `SELECT id FROM organizations WHERE id = ? LIMIT 1`,
          [newOrgId]
        );

        if (!organizationRows?.length) {
          return resolve({
            status: false,
            message: "Organization not found.",
          });
        }
      }

      const effectiveOrgId = Number(newOrgId || orgId);

      // 6. Validate Driver ID
      let parsedDriverId = undefined;

      if (data.driver_id !== undefined) {
        if (
          data.driver_id === null ||
          data.driver_id === ""
        ) {
          parsedDriverId = null;
        } else {
          parsedDriverId = Number(data.driver_id);

          if (
            !Number.isInteger(parsedDriverId) ||
            parsedDriverId <= 0
          ) {
            return resolve({
              status: false,
              message: "Invalid driver ID.",
            });
          }
        }
      }

      // 7. Fetch existing driver assigned to this fleet
      const oldDriverRows = await executeQuery(
        `SELECT id, driver_name
         FROM drivers
         WHERE fleet_id = ? AND orgId = ?
         LIMIT 1`,
        [fleetId, oldFleet.orgId]
      );

      const oldDriver = oldDriverRows?.[0] || null;

      // 8. Validate selected driver
      let newDriver = null;

      if (parsedDriverId) {
        if (!effectiveOrgId) {
          return resolve({
            status: false,
            message: "Organization is required for driver assignment.",
          });
        }

        const driverRows = await executeQuery(
          `SELECT id, orgId, driver_name
           FROM drivers
           WHERE id = ? AND orgId = ?
           LIMIT 1`,
          [parsedDriverId, effectiveOrgId]
        );

        if (!driverRows?.length) {
          return resolve({
            status: false,
            message:
              "Selected driver does not belong to this organization or does not exist.",
          });
        }

        newDriver = driverRows[0];
      }

      // 9. Prepare update data
      const updateData = {
        orgId: orgField ? newOrgId : undefined,

        vehicle_number:
          data.vehicle_number !== undefined
            ? data.vehicle_number?.toUpperCase().trim() || null
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

      // Remove undefined keys
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const targetVehNo =
        updateData.vehicle_number !== undefined
          ? updateData.vehicle_number
          : oldFleet.vehicle_number;

      const driverChanged =
        parsedDriverId !== undefined &&
        Number(parsedDriverId || 0) !== Number(oldDriver?.id || 0);

      // 10. Transaction: update fleet and driver assignment
      await executeTransaction(async (queryFn) => {
        if (Object.keys(updateData).length > 0) {
          await queryFn(
            `UPDATE fleets SET ? WHERE id = ?`,
            [updateData, fleetId]
          );
        }

        // Update assigned vehicle number if fleet vehicle number changes
        if (updateData.vehicle_number !== undefined) {
          await queryFn(
            `UPDATE drivers
             SET assigned_vehicle = ?
             WHERE fleet_id = ? AND orgId = ?`,
            [targetVehNo, fleetId, oldFleet.orgId]
          );
        }

        // Manage driver assignment
        if (parsedDriverId !== undefined) {
          if (parsedDriverId) {
            // Unassign previous driver from this fleet
            await queryFn(
              `UPDATE drivers
               SET fleet_id = NULL, assigned_vehicle = NULL
               WHERE fleet_id = ? AND orgId = ? AND id != ?`,
              [fleetId, effectiveOrgId, parsedDriverId]
            );

            // Ensure driver is not assigned to another fleet
            await queryFn(
              `UPDATE drivers
               SET fleet_id = NULL, assigned_vehicle = NULL
               WHERE id = ? AND orgId = ? AND fleet_id IS NOT NULL AND fleet_id != ?`,
              [parsedDriverId, effectiveOrgId, fleetId]
            );

            // Assign selected driver
            await queryFn(
              `UPDATE drivers
               SET fleet_id = ?, assigned_vehicle = ?
               WHERE id = ? AND orgId = ?`,
              [
                fleetId,
                targetVehNo,
                parsedDriverId,
                effectiveOrgId,
              ]
            );
          } else {
            // Unassign current driver
            await queryFn(
              `UPDATE drivers
               SET fleet_id = NULL, assigned_vehicle = NULL
               WHERE fleet_id = ? AND orgId = ?`,
              [fleetId, oldFleet.orgId]
            );
          }
        }
      });

      // 11. Activity logging
      const performedByName =
        authUser?.name ||
        authUser?.userName ||
        "Admin User";

      // Status change log
      if (
        updateData.status !== undefined &&
        updateData.status !== oldFleet.status
      ) {
        await logFleetActivity({
          fleetId,
          operationType: "STATUS",
          entityType: "STATUS_CHANGE",
          entityId: String(fleetId),
          action: updateData.status === "Active" ? "ACTIVATE" : "UPDATE",
          title: "Vehicle status changed",
          description: `${oldFleet.status} → ${updateData.status}`,
          oldValue: { status: oldFleet.status },
          newValue: { status: updateData.status },
          changedFields: ["status"],
          performedByName,
          source: "fleets",
        });
      }

      // Driver assignment change log
      if (driverChanged) {
        if (parsedDriverId && newDriver) {
          await logFleetActivity({
            fleetId,
            operationType: "DRIVER",
            entityType: "DRIVER_ALLOCATION",
            entityId: String(parsedDriverId),
            action: "ASSIGN",
            title: "Driver assigned",
            description: `Driver: ${newDriver.driver_name}`,
            oldValue: oldDriver
              ? {
                  driver_id: oldDriver.id,
                  driver_name: oldDriver.driver_name,
                }
              : null,
            newValue: {
              driver_id: newDriver.id,
              driver_name: newDriver.driver_name,
            },
            changedFields: ["driver_id", "driver_name"],
            performedByName,
            source: "fleet-driver",
          });
        } else if (oldDriver) {
          await logFleetActivity({
            fleetId,
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
            performedByName,
            source: "fleet-driver",
          });
        }
      }

      // General vehicle details update log
      const hasOtherChanges = Object.keys(updateData).some(
        (key) =>
          key !== "status" &&
          String(oldFleet[key] ?? "") !== String(updateData[key] ?? "")
      );

      if (hasOtherChanges) {
        await logFleetActivity({
          fleetId,
          operationType: "FLEET",
          entityType: "VEHICLE_DETAILS",
          entityId: String(fleetId),
          action: "UPDATE",
          title: "Vehicle details updated",
          description: `Vehicle details updated for ${
            targetVehNo || oldFleet.vehicle_number
          }`,
          oldValue: oldFleet,
          newValue: { ...oldFleet, ...updateData },
          performedByName,
          source: "fleets",
        });
      }

      return resolve({
        status: true,
        message: "Fleet vehicle updated successfully.",
      });
    } catch (error) {
      console.error("Error updating fleet:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return resolve({
          status: false,
          message:
            "A vehicle with this registration number already exists.",
        });
      }

      return resolve({
        status: false,
        message: "Database error while updating fleet vehicle.",
      });
    }
  });
}

export function deleteFleetModel(ids, authUser = null) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return resolve({
          status: false,
          message: "No vehicle IDs provided for deletion",
        });
      }

      let orgId = authUser?.orgId ? Number(authUser.orgId) : null;
      if (!orgId && authUser?.userId) {
        const uRows = await executeQuery(
          "SELECT orgId FROM users WHERE userId = ? LIMIT 1",
          [authUser.userId],
        );
        if (uRows?.[0]?.orgId) {
          orgId = Number(uRows[0].orgId);
        }
      }

      const isSuperAdmin =
        authUser?.role === "super_admin" ||
        authUser?.email === "suraj@agnibyte.com";

      if (authUser && !isSuperAdmin && orgId) {
        const forbiddenFleets = await executeQuery(
          `SELECT id FROM fleets WHERE id IN (?) AND (orgId IS NOT NULL AND orgId != ?)`,
          [ids, orgId]
        );
        if (forbiddenFleets && forbiddenFleets.length > 0) {
          return resolve({
            status: false,
            message: "Unauthorized: Cannot delete vehicles belonging to another organization.",
          });
        }
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
