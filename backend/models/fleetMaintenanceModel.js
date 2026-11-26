import executeQuery, { executeTransaction } from "@/helpers/dbConnection";
import { logFleetActivity } from "./fleetActivityModel";
import { getIndiaDateString } from "@/utilities/timeUtils";

/**
 * Creates a maintenance entry and its media attachments in a MySQL transaction.
 */
export async function createMaintenanceRecordModel(data, authUser = null) {
  const {
    vehicle_id,
    maintenance_type,
    description,
    maintenance_date,
    odometer_reading,
    cost,
    garage_name,
    invoice_number,
    additional_notes,
    status = "Reported",
    media = [],
  } = data;

  const vehicleId = Number(vehicle_id);
  if (!vehicleId || isNaN(vehicleId)) {
    throw new Error("Valid Vehicle ID is required");
  }

  // Verify that the vehicle exists
  const vehicleCheck = await executeQuery(
    "SELECT id, vehicle_number, vehicle_model, status, orgId FROM fleets WHERE id = ? LIMIT 1",
    [vehicleId]
  );
  if (!Array.isArray(vehicleCheck) || vehicleCheck.length === 0) {
    throw new Error("Selected vehicle does not exist");
  }
  const vehicle = vehicleCheck[0];

  // Prevent maintenance supervisor from creating records for vehicles belonging to other organizations
  if (authUser?.role === "maintenance_supervisor") {
    let supervisorOrgId = authUser.orgId ? Number(authUser.orgId) : null;
    if (!supervisorOrgId && authUser.userId) {
      const uRows = await executeQuery("SELECT orgId FROM users WHERE userId = ? LIMIT 1", [authUser.userId]);
      if (uRows?.[0]?.orgId) supervisorOrgId = Number(uRows[0].orgId);
    }
    if (!supervisorOrgId || Number(vehicle.orgId) !== supervisorOrgId) {
      throw new Error("Access denied. You can only record maintenance for vehicles in your organization.");
    }
  }

  const parsedCost = cost !== undefined && cost !== null && cost !== "" ? Math.max(0, parseFloat(cost)) : 0.0;
  const parsedOdometer =
    odometer_reading !== undefined && odometer_reading !== null && odometer_reading !== ""
      ? Math.max(0, parseInt(odometer_reading, 10))
      : null;
  const cleanMaintType = (maintenance_type || "Regular Service").trim();
  const cleanDesc = (description || "").trim();
  const indiaDateStr = getIndiaDateString();
  const cleanDate = maintenance_date
    ? (typeof maintenance_date === "string" && maintenance_date.length >= 10
        ? maintenance_date.slice(0, 10)
        : indiaDateStr)
    : indiaDateStr;
  const cleanStatus = ["Reported", "In Progress", "Completed", "Cancelled"].includes(status) ? status : "Reported";
  const userId = authUser?.userId ? Number(authUser.userId) : null;
  const userName = authUser ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || authUser.email || "Admin User" : "Admin User";

  // Execute database writes inside a transaction
  const result = await executeTransaction(async (queryFn) => {
    // 1. Insert into fleet_maintenance
    const insertSQL = `
      INSERT INTO fleet_maintenance (
        vehicle_id,
        maintenance_type,
        description,
        maintenance_date,
        odometer_reading,
        cost,
        garage_name,
        invoice_number,
        additional_notes,
        status,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertRes = await queryFn(insertSQL, [
      vehicleId,
      cleanMaintType,
      cleanDesc,
      cleanDate,
      parsedOdometer,
      parsedCost,
      garage_name ? String(garage_name).trim() : null,
      invoice_number ? String(invoice_number).trim() : null,
      additional_notes ? String(additional_notes).trim() : null,
      cleanStatus,
      userId,
    ]);

    const maintenanceId = insertRes.insertId;

    // 2. Insert media items if any
    const savedMedia = [];
    if (Array.isArray(media) && media.length > 0) {
      const mediaSQL = `
        INSERT INTO fleet_maintenance_media (
          maintenance_id,
          s3_key,
          file_name,
          mime_type,
          file_size,
          media_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (const item of media) {
        if (!item.s3_key) continue;
        const fileName = (item.file_name || "attachment").substring(0, 255);
        const mimeType = (item.mime_type || "application/octet-stream").substring(0, 100);
        const fileSize = Number(item.file_size) || 0;
        const mediaType = item.media_type || (mimeType.startsWith("video/") ? "video" : "image");

        const mRes = await queryFn(mediaSQL, [
          maintenanceId,
          item.s3_key,
          fileName,
          mimeType,
          fileSize,
          mediaType,
        ]);

        savedMedia.push({
          id: mRes.insertId,
          maintenance_id: maintenanceId,
          s3_key: item.s3_key,
          file_name: fileName,
          mime_type: mimeType,
          file_size: fileSize,
          media_type: mediaType,
        });
      }
    }

    // 3. If maintenance status is 'In Progress' and vehicle status is 'Active', optionally reflect on vehicle
    if (cleanStatus === "In Progress" && vehicle.status === "Active") {
      await queryFn("UPDATE fleets SET status = 'Maintenance' WHERE id = ?", [vehicleId]);
    } else if (cleanStatus === "Completed" && vehicle.status === "Maintenance") {
      await queryFn("UPDATE fleets SET status = 'Active' WHERE id = ?", [vehicleId]);
    }

    return {
      id: maintenanceId,
      vehicle_id: vehicleId,
      maintenance_type: cleanMaintType,
      description: cleanDesc,
      maintenance_date: cleanDate,
      created_at: new Date().toISOString(),
      odometer_reading: parsedOdometer,
      cost: parsedCost,
      garage_name: garage_name || null,
      invoice_number: invoice_number || null,
      additional_notes: additional_notes || null,
      status: cleanStatus,
      created_by: userId,
      media: savedMedia,
    };
  });

  // Log activity in fleet_activity_history (non-blocking)
  try {
    await logFleetActivity({
      fleetId: vehicleId,
      operationType: "MAINTENANCE",
      entityType: "MAINTENANCE_RECORD",
      entityId: String(result.id),
      action: "CREATE",
      title: `${cleanMaintType} logged`,
      description: cleanDesc.length > 80 ? cleanDesc.substring(0, 77) + "..." : cleanDesc,
      oldValue: null,
      newValue: {
        id: result.id,
        maintenance_type: cleanMaintType,
        cost: parsedCost,
        status: cleanStatus,
        date: cleanDate,
        media: savedMedia,
      },
      changedFields: ["maintenance_type", "cost", "status", "maintenance_date"],
      performedBy: userId ? String(userId) : null,
      performedByName: userName,
      performedAt: new Date(),
      source: "maintenance",
      metadata: {
        vehicle_number: vehicle.vehicle_number,
        cost: parsedCost,
        garage: garage_name || null,
        maintenance_id: result.id,
        media: savedMedia,
      },
    });
  } catch (actErr) {
    console.warn("Could not log maintenance activity:", actErr?.message);
  }

  return result;
}

/**
 * Retrieves paginated maintenance records and overall vehicle summary metrics.
 */
export async function getMaintenanceListByVehicleModel({
  vehicleId,
  page = 1,
  limit = 10,
  status = null,
  maintenanceType = null,
  dateFilter = null,
  sortBy = "newest",
  search = null,
  exportAll = false,
}) {
  const vid = Number(vehicleId);
  if (!vid || isNaN(vid)) {
    throw new Error("Valid vehicle ID is required");
  }

  const isExport = Boolean(exportAll || limit === "all" || Number(limit) > 50);
  const pageNum = isExport ? 1 : Math.max(1, parseInt(page, 10) || 1);
  const limitNum = isExport
    ? Math.min(5000, Math.max(1, parseInt(limit, 10) || 1000))
    : Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  // Build WHERE conditions
  const whereClauses = ["m.vehicle_id = ?"];
  const params = [vid];

  if (status && status !== "all") {
    whereClauses.push("m.status = ?");
    params.push(status);
  }

  if (maintenanceType && maintenanceType !== "all") {
    whereClauses.push("m.maintenance_type = ?");
    params.push(maintenanceType);
  }

  if (dateFilter && dateFilter !== "all") {
    if (dateFilter === "30days") {
      whereClauses.push("m.maintenance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)");
    } else if (dateFilter === "3months") {
      whereClauses.push("m.maintenance_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
    } else if (dateFilter === "6months") {
      whereClauses.push("m.maintenance_date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)");
    } else if (dateFilter === "1year" || dateFilter === "this_year") {
      whereClauses.push("m.maintenance_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)");
    }
  }

  if (search && String(search).trim() !== "") {
    whereClauses.push(
      "(m.description LIKE ? OR m.garage_name LIKE ? OR m.invoice_number LIKE ? OR m.maintenance_type LIKE ? OR m.additional_notes LIKE ?)"
    );
    const likeVal = `%${String(search).trim()}%`;
    params.push(likeVal, likeVal, likeVal, likeVal, likeVal);
  }

  const whereSQL = whereClauses.join(" AND ");

  // Determine sort order
  let orderSQL = "m.maintenance_date DESC, m.id DESC";
  if (sortBy === "oldest") {
    orderSQL = "m.maintenance_date ASC, m.id ASC";
  } else if (sortBy === "cost_desc") {
    orderSQL = "m.cost DESC, m.id DESC";
  } else if (sortBy === "cost_asc") {
    orderSQL = "m.cost ASC, m.id ASC";
  }

  // 1. Fetch paginated records
  const querySQL = `
    SELECT 
      m.*,
      f.vehicle_number,
      f.vehicle_model,
      CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS created_by_name,
      (SELECT COUNT(*) FROM fleet_maintenance_media WHERE maintenance_id = m.id) AS media_count
    FROM fleet_maintenance m
    LEFT JOIN fleets f ON f.id = m.vehicle_id
    LEFT JOIN users u ON u.userId = m.created_by
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT ? OFFSET ?
  `;

  const countSQL = `
    SELECT COUNT(*) AS total
    FROM fleet_maintenance m
    WHERE ${whereSQL}
  `;

  // 2. Fetch overall vehicle maintenance summary metrics
  const summarySQL = `
    SELECT 
      COUNT(*) AS total_records,
      COALESCE(SUM(cost), 0) AS total_expenditure,
      MAX(maintenance_date) AS last_maintenance_date,
      (
        SELECT status 
        FROM fleet_maintenance 
        WHERE vehicle_id = ? 
        ORDER BY maintenance_date DESC, id DESC 
        LIMIT 1
      ) AS latest_status,
      (
        SELECT maintenance_type 
        FROM fleet_maintenance 
        WHERE vehicle_id = ? 
        ORDER BY maintenance_date DESC, id DESC 
        LIMIT 1
      ) AS latest_type
    FROM fleet_maintenance
    WHERE vehicle_id = ?
  `;

  const [records, countRes, summaryRes] = await Promise.all([
    executeQuery(querySQL, [...params, limitNum, offset]),
    executeQuery(countSQL, params),
    executeQuery(summarySQL, [vid, vid, vid]),
  ]);

  const total = countRes?.[0]?.total || 0;
  const summaryRow = summaryRes?.[0] || {};

  const summary = {
    total_records: Number(summaryRow.total_records) || 0,
    total_expenditure: parseFloat(summaryRow.total_expenditure) || 0.0,
    last_maintenance_date: summaryRow.last_maintenance_date || null,
    latest_status: summaryRow.latest_status || "No Records",
    latest_type: summaryRow.latest_type || null,
  };

  // If there are records, fetch attachment previews for cards
  const recordList = Array.isArray(records) ? records : [];
  if (recordList.length > 0) {
    const recordIds = recordList.map((r) => r.id);
    const mediaSQL = `
      SELECT id, maintenance_id, s3_key, file_name, mime_type, file_size, media_type, created_at
      FROM fleet_maintenance_media
      WHERE maintenance_id IN (?)
      ORDER BY id ASC
    `;
    const mediaRows = await executeQuery(mediaSQL, [recordIds]).catch(() => []);
    const mediaMap = {};
    (mediaRows || []).forEach((m) => {
      if (!mediaMap[m.maintenance_id]) mediaMap[m.maintenance_id] = [];
      mediaMap[m.maintenance_id].push(m);
    });

    recordList.forEach((r) => {
      r.media = mediaMap[r.id] || [];
    });
  }

  return {
    records: recordList,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    summary,
  };
}

/**
 * Retrieves a single maintenance record with its full media list.
 */
export async function getMaintenanceByIdModel(id) {
  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    throw new Error("Invalid maintenance record ID");
  }

  const selectSQL = `
    SELECT 
      m.*,
      f.vehicle_number,
      f.vehicle_model,
      f.chassis_number,
      CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, '')) AS created_by_name
    FROM fleet_maintenance m
    LEFT JOIN fleets f ON f.id = m.vehicle_id
    LEFT JOIN users u ON u.userId = m.created_by
    WHERE m.id = ?
    LIMIT 1
  `;

  const rows = await executeQuery(selectSQL, [mid]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const record = rows[0];

  const mediaSQL = `
    SELECT id, maintenance_id, s3_key, file_name, mime_type, file_size, media_type, created_at
    FROM fleet_maintenance_media
    WHERE maintenance_id = ?
    ORDER BY id ASC
  `;
  const media = await executeQuery(mediaSQL, [mid]).catch(() => []);

  record.media = Array.isArray(media) ? media : [];
  return record;
}

/**
 * Updates a maintenance record and handles newly added media attachments.
 */
export async function updateMaintenanceRecordModel(id, data, authUser = null) {
  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    throw new Error("Invalid maintenance record ID");
  }

  // Fetch current record
  const current = await getMaintenanceByIdModel(mid);
  if (!current) {
    throw new Error("Maintenance record not found");
  }

  const {
    maintenance_type,
    description,
    maintenance_date,
    odometer_reading,
    cost,
    garage_name,
    invoice_number,
    additional_notes,
    status,
    newMedia = [],
  } = data;

  const updates = [];
  const params = [];

  if (maintenance_type !== undefined) {
    updates.push("maintenance_type = ?");
    params.push(String(maintenance_type).trim());
  }

  if (description !== undefined) {
    updates.push("description = ?");
    params.push(String(description).trim());
  }

  if (maintenance_date !== undefined) {
    updates.push("maintenance_date = ?");
    params.push(new Date(maintenance_date).toISOString().slice(0, 10));
  }

  if (odometer_reading !== undefined) {
    updates.push("odometer_reading = ?");
    params.push(
      odometer_reading !== null && odometer_reading !== ""
        ? Math.max(0, parseInt(odometer_reading, 10))
        : null
    );
  }

  if (cost !== undefined) {
    updates.push("cost = ?");
    params.push(cost !== null && cost !== "" ? Math.max(0, parseFloat(cost)) : 0.0);
  }

  if (garage_name !== undefined) {
    updates.push("garage_name = ?");
    params.push(garage_name ? String(garage_name).trim() : null);
  }

  if (invoice_number !== undefined) {
    updates.push("invoice_number = ?");
    params.push(invoice_number ? String(invoice_number).trim() : null);
  }

  if (additional_notes !== undefined) {
    updates.push("additional_notes = ?");
    params.push(additional_notes ? String(additional_notes).trim() : null);
  }

  if (status !== undefined && ["Reported", "In Progress", "Completed", "Cancelled"].includes(status)) {
    updates.push("status = ?");
    params.push(status);
  }

  await executeTransaction(async (queryFn) => {
    if (updates.length > 0) {
      const updateSQL = `UPDATE fleet_maintenance SET ${updates.join(", ")} WHERE id = ?`;
      await queryFn(updateSQL, [...params, mid]);
    }

    // Insert any new attachments
    if (Array.isArray(newMedia) && newMedia.length > 0) {
      const mediaSQL = `
        INSERT INTO fleet_maintenance_media (
          maintenance_id,
          s3_key,
          file_name,
          mime_type,
          file_size,
          media_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (const item of newMedia) {
        if (!item.s3_key) continue;
        await queryFn(mediaSQL, [
          mid,
          item.s3_key,
          (item.file_name || "attachment").substring(0, 255),
          (item.mime_type || "application/octet-stream").substring(0, 100),
          Number(item.file_size) || 0,
          item.media_type || (item.mime_type?.startsWith("video/") ? "video" : "image"),
        ]);
      }
    }
  });

  const updatedRecord = await getMaintenanceByIdModel(mid);

  // Log activity
  const userName = authUser ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || authUser.email || "Admin User" : "Admin User";
  try {
    await logFleetActivity({
      fleetId: current.vehicle_id,
      operationType: "MAINTENANCE",
      entityType: "MAINTENANCE_RECORD",
      entityId: String(mid),
      action: "UPDATE",
      title: `${updatedRecord.maintenance_type} updated`,
      description: `Status: ${updatedRecord.status}, Cost: ₹${Number(updatedRecord.cost || 0).toLocaleString("en-IN")}`,
      oldValue: { status: current.status, cost: current.cost },
      newValue: { status: updatedRecord.status, cost: updatedRecord.cost },
      changedFields: updates.map((u) => u.split(" ")[0]),
      performedBy: authUser?.userId ? String(authUser.userId) : null,
      performedByName: userName,
      performedAt: new Date(),
      source: "maintenance",
      metadata: {
        vehicle_number: current.vehicle_number,
      },
    });
  } catch (actErr) {
    console.warn("Could not log maintenance activity:", actErr?.message);
  }

  return updatedRecord;
}

/**
 * Deletes a single media attachment from database and returns its s3_key.
 */
export async function deleteMaintenanceMediaModel(maintenanceId, mediaId) {
  const mid = Number(maintenanceId);
  const mediaItemId = Number(mediaId);

  const rows = await executeQuery(
    "SELECT id, s3_key, maintenance_id FROM fleet_maintenance_media WHERE id = ? AND maintenance_id = ? LIMIT 1",
    [mediaItemId, mid]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const mediaItem = rows[0];
  await executeQuery("DELETE FROM fleet_maintenance_media WHERE id = ?", [mediaItemId]);
  return mediaItem;
}

/**
 * Deletes a maintenance record and returns all associated s3_keys for S3 deletion.
 */
export async function deleteMaintenanceRecordModel(id, authUser = null) {
  const mid = Number(id);
  if (!mid || isNaN(mid)) {
    throw new Error("Invalid maintenance record ID");
  }

  const record = await getMaintenanceByIdModel(mid);
  if (!record) {
    return null;
  }

  const s3Keys = record.media.map((m) => m.s3_key).filter(Boolean);

  // Deletion cascades to fleet_maintenance_media via foreign key
  await executeQuery("DELETE FROM fleet_maintenance WHERE id = ?", [mid]);

  // Log activity
  const userName = authUser ? `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || authUser.email || "Admin User" : "Admin User";
  try {
    await logFleetActivity({
      fleetId: record.vehicle_id,
      operationType: "MAINTENANCE",
      entityType: "MAINTENANCE_RECORD",
      entityId: String(mid),
      action: "DELETE",
      title: `${record.maintenance_type} record deleted`,
      description: `Removed maintenance record #${mid} for ${record.vehicle_number}`,
      oldValue: { id: mid, maintenance_type: record.maintenance_type },
      newValue: null,
      changedFields: ["id"],
      performedBy: authUser?.userId ? String(authUser.userId) : null,
      performedByName: userName,
      performedAt: new Date(),
      source: "maintenance",
      metadata: {
        vehicle_number: record.vehicle_number,
      },
    });
  } catch (actErr) {
    console.warn("Could not log maintenance deletion activity:", actErr?.message);
  }

  return {
    deleted: true,
    s3Keys,
    record,
  };
}
