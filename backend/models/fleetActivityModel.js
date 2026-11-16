import executeQuery from "@/helpers/dbConnection";

/**
 * Resolves fleetId from a vehicle number string if fleetId is not directly supplied.
 */
export async function resolveFleetIdByVehicleNo(vehicleNo) {
  if (!vehicleNo || typeof vehicleNo !== "string") return null;
  try {
    const clean = String(vehicleNo).replace(/[^a-zA-Z0-9]/g, "");
    const rows = await executeQuery(
      `SELECT id FROM fleets WHERE REPLACE(REPLACE(vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = ? LIMIT 1`,
      [clean]
    );
    if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
      return Number(rows[0].id);
    }
  } catch (err) {
    console.warn("Could not resolve fleetId by vehicleNo:", err?.message);
  }
  return null;
}

/**
 * Low-level insert helper for an activity history record.
 */
async function insertActivityRecord(record) {
  const {
    fleetId,
    operationType = "FLEET",
    entityType = "VEHICLE_INFO",
    entityId = null,
    action = "UPDATE",
    title,
    description = "",
    oldValue = null,
    newValue = null,
    changedFields = null,
    performedBy = null,
    performedByName = null,
    performedAt = null,
    source = "system",
    metadata = null,
  } = record;

  if (!fleetId) return false;

  const payload = {
    fleet_id: Number(fleetId),
    operation_type: String(operationType).toUpperCase(),
    entity_type: String(entityType).toUpperCase(),
    entity_id: entityId ? String(entityId) : null,
    action: String(action).toUpperCase(),
    title: title || `${operationType} ${action}`,
    description: description || null,
    old_value: oldValue ? (typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue)) : null,
    new_value: newValue ? (typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue)) : null,
    changed_fields: changedFields ? JSON.stringify(Array.isArray(changedFields) ? changedFields : [changedFields]) : null,
    performed_by: performedBy ? String(performedBy) : null,
    performed_by_name: performedByName ? String(performedByName) : "Admin User",
    source: source ? String(source).toLowerCase() : "system",
    metadata: metadata ? (typeof metadata === "object" ? JSON.stringify(metadata) : String(metadata)) : null,
  };

  if (performedAt) {
    payload.performed_at = new Date(performedAt);
  }

  const query = `INSERT INTO fleet_activity_history SET ?`;
  const result = await executeQuery(query, payload);
  return result?.affectedRows > 0;
}

/**
 * Helper to compute changed fields between two objects.
 */
export function computeChangedFields(oldObj = {}, newObj = {}, ignoredKeys = ["updated_at", "created_at"]) {
  if (!oldObj || typeof oldObj !== "object") return Object.keys(newObj || {});
  if (!newObj || typeof newObj !== "object") return [];

  const changes = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  allKeys.forEach((key) => {
    if (ignoredKeys.includes(key)) return;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (newVal !== undefined && String(oldVal ?? "") !== String(newVal ?? "")) {
      changes.push(key);
    }
  });

  return changes;
}

/**
 * Centralized function to log any fleet activity/operation.
 * Extensible for current and future modules.
 */
export async function logFleetActivity(params) {
  try {
    let fleetId = params.fleetId ? Number(params.fleetId) : null;

    // Fallback: If fleetId is missing but vehicleNo is provided, resolve fleetId
    if (!fleetId && params.vehicleNo) {
      fleetId = await resolveFleetIdByVehicleNo(params.vehicleNo);
    }
    if (!fleetId && params.vehicle_number) {
      fleetId = await resolveFleetIdByVehicleNo(params.vehicle_number);
    }

    if (!fleetId) {
      // Activity is not linked to any fleet vehicle
      return { status: false, message: "fleetId could not be resolved for activity logging" };
    }

    // Auto compute changed fields if not provided
    let changedFields = params.changedFields;
    if (!changedFields && params.oldValue && params.newValue) {
      changedFields = computeChangedFields(params.oldValue, params.newValue);
    }

    await insertActivityRecord({
      ...params,
      fleetId,
      changedFields,
    });

    return { status: true, message: "Activity logged successfully", fleetId };
  } catch (error) {
    console.error("Error logging fleet activity:", error);
    return { status: false, error: error?.message };
  }
}

/**
 * Automatically syncs any unsynced maintenance records into fleet_activity_history.
 * Ensures that whenever a maintenance record is created (e.g. by a maintenance supervisor)
 * it reliably appears in the All Activities timeline.
 */
export async function syncFleetMaintenanceActivities(fleetId = null) {
  try {
    let sql = `
      SELECT m.id, m.vehicle_id, m.maintenance_type, m.description, m.maintenance_date, m.cost, m.status, m.garage_name, m.created_by, m.created_at,
             CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS user_name,
             u.email AS user_email,
             f.vehicle_number
      FROM fleet_maintenance m
      LEFT JOIN fleets f ON f.id = m.vehicle_id
      LEFT JOIN users u ON u.userId = m.created_by
      WHERE m.id NOT IN (
        SELECT entity_id FROM fleet_activity_history 
        WHERE operation_type = 'MAINTENANCE' AND action = 'CREATE'
      )
    `;
    const params = [];
    if (fleetId) {
      sql += ` AND m.vehicle_id = ?`;
      params.push(Number(fleetId));
    }
    sql += ` ORDER BY m.id ASC`;

    const unsyncedRows = await executeQuery(sql, params);
    if (!Array.isArray(unsyncedRows) || unsyncedRows.length === 0) {
      return 0;
    }

    const recordIds = unsyncedRows.map((r) => r.id);
    const mediaSQL = `
      SELECT id, maintenance_id, s3_key, file_name, mime_type, file_size, media_type
      FROM fleet_maintenance_media
      WHERE maintenance_id IN (?)
    `;
    const mediaRows = await executeQuery(mediaSQL, [recordIds]).catch(() => []);
    const mediaMap = {};
    (mediaRows || []).forEach((m) => {
      if (!mediaMap[m.maintenance_id]) mediaMap[m.maintenance_id] = [];
      mediaMap[m.maintenance_id].push(m);
    });

    let syncedCount = 0;
    for (const record of unsyncedRows) {
      const cleanType = (record.maintenance_type || "Maintenance").trim();
      const cleanDesc = (record.description || "").trim();
      const performerName = (record.user_name || "").trim() || record.user_email || "Maintenance Supervisor";
      const mediaList = mediaMap[record.id] || [];

      const success = await insertActivityRecord({
        fleetId: Number(record.vehicle_id),
        operationType: "MAINTENANCE",
        entityType: "MAINTENANCE_RECORD",
        entityId: String(record.id),
        action: "CREATE",
        title: `${cleanType} logged`,
        description:
          cleanDesc.length > 80
            ? cleanDesc.substring(0, 77) + "..."
            : cleanDesc || `${cleanType} logged for vehicle ${record.vehicle_number || ""}`,
        oldValue: null,
        newValue: {
          id: record.id,
          maintenance_type: cleanType,
          cost: record.cost,
          status: record.status,
          date: record.maintenance_date,
          media: mediaList,
        },
        changedFields: ["maintenance_type", "cost", "status", "maintenance_date"],
        performedBy: record.created_by ? String(record.created_by) : null,
        performedByName: performerName,
        performedAt: record.created_at || record.maintenance_date || null,
        source: "maintenance",
        metadata: {
          vehicle_number: record.vehicle_number,
          cost: record.cost,
          garage: record.garage_name || null,
          maintenance_id: record.id,
          media: mediaList,
        },
      });

      if (success) {
        syncedCount++;
      }
    }

    return syncedCount;
  } catch (err) {
    console.warn("Could not auto-sync maintenance activities:", err?.message);
    return 0;
  }
}

/**
 * Fetches chronological activity history for a specific fleetId with
 * multi-dimensional filtering, search, category metrics, and pagination.
 */
export async function getFleetActivityHistoryModel(filters = {}) {
  try {
    const {
      fleetId,
      vehicleNo,
      type,
      operationType,
      action,
      entityType,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = filters;

    let targetFleetId = fleetId ? Number(fleetId) : null;
    if (!targetFleetId && (vehicleNo || filters.vehicle_number)) {
      targetFleetId = await resolveFleetIdByVehicleNo(vehicleNo || filters.vehicle_number);
    }

    if (!targetFleetId) {
      return {
        status: false,
        message: "Valid fleetId is required to fetch activity history.",
        data: [],
        summary: { total: 0 },
      };
    }

    // Auto-sync any unsynced maintenance records before querying so "All Activities" always includes them
    await syncFleetMaintenanceActivities(targetFleetId);

    // Base condition
    const conditions = ["fleet_id = ?"];
    const queryParams = [targetFleetId];

    // Filter by operation type (e.g. 'DOCUMENT', 'DRIVER', 'EMI', 'FLEET', 'MAINTENANCE', 'STATUS')
    const activeType = type || operationType;
    if (activeType && activeType !== "ALL" && activeType !== "all") {
      const upperType = activeType.toUpperCase();
      if (upperType === "STATUS") {
        conditions.push("(operation_type = 'STATUS' OR action IN ('ACTIVATE', 'DEACTIVATE') OR entity_type = 'STATUS_CHANGE')");
      } else if (upperType === "VEHICLE_DETAILS" || upperType === "VEHICLE DETAILS" || upperType === "FLEET") {
        conditions.push("operation_type = 'FLEET'");
      } else if (upperType === "DOCUMENTS" || upperType === "DOCUMENT") {
        conditions.push("operation_type = 'DOCUMENT'");
      } else if (upperType === "DRIVERS" || upperType === "DRIVER") {
        conditions.push("operation_type = 'DRIVER'");
      } else if (upperType === "EMIS" || upperType === "EMI") {
        conditions.push("operation_type = 'EMI'");
      } else if (upperType === "MAINTENANCES" || upperType === "MAINTENANCE") {
        conditions.push("operation_type = 'MAINTENANCE'");
      } else {
        conditions.push("operation_type = ?");
        queryParams.push(upperType);
      }
    }

    // Filter by action (e.g. 'CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'UNASSIGN', 'UPLOAD', 'RENEW')
    if (action && action !== "ALL" && action !== "all") {
      conditions.push("action = ?");
      queryParams.push(action.toUpperCase());
    }

    // Filter by entityType (e.g. 'INSURANCE', 'PUC', 'FITNESS')
    if (entityType && entityType !== "ALL" && entityType !== "all") {
      conditions.push("entity_type = ?");
      queryParams.push(entityType.toUpperCase());
    }

    // Filter by date range
    if (fromDate) {
      conditions.push("performed_at >= ?");
      queryParams.push(new Date(fromDate).toISOString().slice(0, 19).replace("T", " "));
    }
    if (toDate) {
      conditions.push("performed_at <= ?");
      queryParams.push(new Date(toDate).toISOString().slice(0, 19).replace("T", " "));
    }

    // Search query filter (search across title, description, performed_by_name)
    if (search && search.trim()) {
      conditions.push("(title LIKE ? OR description LIKE ? OR performed_by_name LIKE ?)");
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get summary counts by category for this fleet
    const summaryQuery = `
      SELECT 
        COUNT(*) AS total_all,
        SUM(CASE WHEN operation_type = 'DOCUMENT' THEN 1 ELSE 0 END) AS count_documents,
        SUM(CASE WHEN operation_type = 'DRIVER' THEN 1 ELSE 0 END) AS count_driver,
        SUM(CASE WHEN operation_type = 'EMI' THEN 1 ELSE 0 END) AS count_emi,
        SUM(CASE WHEN operation_type = 'MAINTENANCE' THEN 1 ELSE 0 END) AS count_maintenance,
        SUM(CASE WHEN operation_type = 'FLEET' THEN 1 ELSE 0 END) AS count_vehicle_details,
        SUM(CASE WHEN operation_type = 'STATUS' OR action IN ('ACTIVATE', 'DEACTIVATE') OR entity_type = 'STATUS_CHANGE' THEN 1 ELSE 0 END) AS count_status
      FROM fleet_activity_history
      WHERE fleet_id = ?
    `;
    const summaryRows = await executeQuery(summaryQuery, [targetFleetId]);
    const counts = summaryRows?.[0] || {};

    // 2. Total filtered records count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM fleet_activity_history ${whereClause}`;
    const totalRes = await executeQuery(countQuery, queryParams);
    const totalRecords = totalRes?.[0]?.total || 0;

    // 3. Paginated records
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (parsedPage - 1) * parsedLimit;

    const dataQuery = `
      SELECT 
        id,
        fleet_id AS fleetId,
        operation_type AS operationType,
        entity_type AS entityType,
        entity_id AS entityId,
        action,
        title,
        description,
        old_value AS oldValue,
        new_value AS newValue,
        changed_fields AS changedFields,
        performed_by AS performedBy,
        performed_by_name AS performedByName,
        performed_at AS performedAt,
        source,
        metadata,
        created_at AS createdAt
      FROM fleet_activity_history
      ${whereClause}
      ORDER BY performed_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const records = await executeQuery(dataQuery, [...queryParams, parsedLimit, offset]);

    // Format JSON fields safely
    const formattedRecords = (records || []).map((row) => {
      let parsedOld = null;
      let parsedNew = null;
      let parsedFields = null;
      let parsedMeta = null;

      try {
        if (row.oldValue) parsedOld = JSON.parse(row.oldValue);
      } catch (_) {
        parsedOld = row.oldValue;
      }

      try {
        if (row.newValue) parsedNew = JSON.parse(row.newValue);
      } catch (_) {
        parsedNew = row.newValue;
      }

      try {
        if (row.changedFields) parsedFields = JSON.parse(row.changedFields);
      } catch (_) {
        parsedFields = row.changedFields;
      }

      try {
        if (row.metadata) parsedMeta = JSON.parse(row.metadata);
      } catch (_) {
        parsedMeta = row.metadata;
      }

      return {
        ...row,
        oldValue: parsedOld,
        newValue: parsedNew,
        changedFields: parsedFields,
        metadata: parsedMeta,
      };
    });

    const totalPages = Math.ceil(totalRecords / parsedLimit) || 1;

    return {
      status: true,
      fleetId: targetFleetId,
      data: formattedRecords,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalRecords,
        totalPages,
        hasMore: parsedPage < totalPages,
      },
      summary: {
        all: Number(counts.total_all) || 0,
        documents: Number(counts.count_documents) || 0,
        driver: Number(counts.count_driver) || 0,
        emi: Number(counts.count_emi) || 0,
        maintenance: Number(counts.count_maintenance) || 0,
        vehicleDetails: Number(counts.count_vehicle_details) || 0,
        status: Number(counts.count_status) || 0,
      },
      message: "Fleet activity history fetched successfully",
    };
  } catch (error) {
    console.error("Error in getFleetActivityHistoryModel:", error);
    return {
      status: false,
      message: error?.message || "Failed to fetch fleet activity history",
      data: [],
      summary: { all: 0 },
    };
  }
}
