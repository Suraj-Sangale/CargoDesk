import executeQuery from "@/helpers/dbConnection";
import { logFleetActivity } from "./fleetActivityModel";

const response = {
  status: false,
  message: "Something went wrong",
};

let isTableMigrated = false;

async function ensureEmiTableColumns() {
  if (isTableMigrated) return;
  try {
    const columns = await executeQuery(`SHOW COLUMNS FROM emi_master`);
    const existingCols = Array.isArray(columns) ? columns.map((col) => col.Field) : [];

    const colsToAdd = [
      { name: "vehicle_number", type: "VARCHAR(50) NULL" },
      { name: "bank_name", type: "VARCHAR(100) NULL" },
      { name: "loan_account_no", type: "VARCHAR(100) NULL" },
      { name: "emis_paid", type: "INT DEFAULT 0" },
      { name: "interest_rate", type: "DECIMAL(5,2) NULL" },
      { name: "down_payment", type: "DECIMAL(12,2) NULL" },
      { name: "notes", type: "TEXT NULL" },
    ];

    for (const col of colsToAdd) {
      if (!existingCols.includes(col.name)) {
        try {
          await executeQuery(`ALTER TABLE emi_master ADD COLUMN ${col.name} ${col.type}`);
        } catch (err) {
          console.warn(`Column ${col.name} might already exist or alter failed:`, err?.message);
        }
      }
    }
    isTableMigrated = true;
  } catch (error) {
    console.error("Error inspecting/migrating emi_master schema:", error);
  }
}

export function addNewEmiModel(data) {
  return new Promise(async (resolve, reject) => {
    try {
      let fleetId = data.fleet_id || data.fleetId || null;
      let vehicle_number = data.vehicle_number || null;

      // Fallback lookup if only one identifier is provided
      if (fleetId && !vehicle_number) {
        const fleetRows = await executeQuery(`SELECT vehicle_number FROM fleets WHERE id = ? LIMIT 1`, [fleetId]);
        if (fleetRows?.[0]?.vehicle_number) {
          vehicle_number = fleetRows[0].vehicle_number;
        }
      } else if (!fleetId && vehicle_number) {
        const clean = String(vehicle_number).replace(/[^a-zA-Z0-9]/g, "");
        const fleetRows = await executeQuery(
          `SELECT id, vehicle_number FROM fleets WHERE REPLACE(REPLACE(vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = ? LIMIT 1`,
          [clean]
        );
        if (fleetRows?.[0]) {
          fleetId = fleetRows[0].id;
          vehicle_number = fleetRows[0].vehicle_number;
        }
      }

      const insertQuery = `INSERT INTO emi_master SET ?`;
      const {
        loan_name,
        bank_name,
        loan_account_no,
        loan_amount,
        emi_amount,
        tenure_months,
        emis_paid,
        interest_rate,
        down_payment,
        start_date,
        payment_mode,
        due_date,
        notes,
      } = data;

      const payload = {
        fleet_id: fleetId ? Number(fleetId) : null,
        vehicle_number: vehicle_number || null,
        loan_name: loan_name || null,
        bank_name: bank_name || null,
        loan_account_no: loan_account_no || null,
        loan_amount: loan_amount ? parseFloat(loan_amount) : 0,
        emi_amount: emi_amount ? parseFloat(emi_amount) : 0,
        tenure_months: tenure_months ? parseInt(tenure_months, 10) : 0,
        emis_paid: emis_paid ? parseInt(emis_paid, 10) : 0,
        interest_rate: interest_rate ? parseFloat(interest_rate) : null,
        down_payment: down_payment ? parseFloat(down_payment) : null,
        start_date: start_date || null,
        payment_mode: payment_mode || null,
        due_date: due_date || null,
        notes: notes || null,
        status: 1,
      };

      const result = await executeQuery(insertQuery, payload);
      if (result && result.affectedRows > 0) {
        const emiId = result.insertId;
        // Centralized Fleet Activity Logging for EMI addition
        await logFleetActivity({
          fleetId: fleetId || null,
          vehicleNo: vehicle_number,
          operationType: "EMI",
          entityType: "FINANCE_EMI",
          entityId: String(emiId),
          action: "CREATE",
          title: "EMI record added",
          description: `Loan ${loan_name || bank_name || "Facility"} added (₹${emi_amount || 0}/mo for vehicle ${vehicle_number || `Fleet #${fleetId}`})`,
          oldValue: null,
          newValue: payload,
          changedFields: Object.keys(payload),
          performedByName: data.performedByName || "Admin User",
          source: "emi",
          metadata: { fleet_id: fleetId, vehicle_number, loan_account_no, bank_name },
        });

        resolve({
          status: true,
          id: result.insertId,
          fleet_id: fleetId,
          vehicle_number,
          message: "EMI details added successfully",
        });
      } else {
        resolve({
          status: false,
          message: "Failed to add EMI details.",
        });
      }
    } catch (error) {
      console.error("Error adding EMI:", error);
      if (error.code === "ER_DUP_ENTRY") {
        resolve({
          status: false,
          message: "EMI details already exists. Please check in All EMIs section",
        });
      } else {
        resolve({
          status: false,
          message: "Database error while adding EMI details.",
        });
      }
    }
  });
}

export function getAllEmisModel() {
  return new Promise(async (resolve, reject) => {
    try {
      const selectQuery = `
        SELECT 
          e.*,
          COALESCE(e.fleet_id, f.id) AS fleet_id,
          COALESCE(f.vehicle_number, e.vehicle_number) AS vehicle_number,
          f.vehicle_model,
          f.vehicle_type,
          f.status AS vehicle_status
        FROM emi_master e
        LEFT JOIN fleets f ON (
          (e.fleet_id IS NOT NULL AND e.fleet_id = f.id)
          OR (
            e.fleet_id IS NULL 
            AND REPLACE(REPLACE(e.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
                REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
          )
        )
        ORDER BY e.created_at DESC
      `;
      const rows = await executeQuery(selectQuery);
      resolve({
        status: true,
        data: rows,
        message: "EMIs fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching EMIs:", error);
      reject({
        status: false,
        message: "Database error while fetching EMIs",
      });
    }
  });
}

// ✅ Update EMI entry
export function updateEmiModel(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch old record before update for diffing
      const oldRows = await executeQuery(`SELECT * FROM emi_master WHERE id = ?`, [id]);
      const oldEmi = Array.isArray(oldRows) && oldRows.length > 0 ? oldRows[0] : null;

      const fleetId = data.fleet_id || data.fleetId || oldEmi?.fleet_id || null;
      const vehicle_number = data.vehicle_number || oldEmi?.vehicle_number || null;

      const updateData = {
        fleet_id: fleetId ? Number(fleetId) : null,
        vehicle_number: vehicle_number || null,
        loan_name: data.loan_name || null,
        bank_name: data.bank_name || null,
        loan_account_no: data.loan_account_no || null,
        loan_amount: data.loan_amount ? parseFloat(data.loan_amount) : 0,
        emi_amount: data.emi_amount ? parseFloat(data.emi_amount) : 0,
        tenure_months: data.tenure_months ? parseInt(data.tenure_months, 10) : 0,
        emis_paid:
          data.emis_paid !== undefined && data.emis_paid !== ""
            ? parseInt(data.emis_paid, 10)
            : 0,
        interest_rate: data.interest_rate ? parseFloat(data.interest_rate) : null,
        down_payment: data.down_payment ? parseFloat(data.down_payment) : null,
        start_date: data.start_date || null,
        payment_mode: data.payment_mode || null,
        due_date: data.due_date || null,
        notes: data.notes || null,
        status: data.status === "Active" || data.status === 1 ? 1 : 0,
      };

      const updateQuery = `UPDATE emi_master SET ? WHERE id = ?`;
      const result = await executeQuery(updateQuery, [updateData, id]);

      if (result.affectedRows > 0) {
        if (oldEmi) {
          let description = `EMI details updated for ${updateData.bank_name || oldEmi.bank_name || "loan"}`;
          if (updateData.due_date && oldEmi.due_date !== updateData.due_date) {
            description = `Next EMI date changed from ${oldEmi.due_date || "N/A"} → ${updateData.due_date}`;
          }

          await logFleetActivity({
            fleetId: data.fleetId || null,
            vehicleNo: updateData.vehicle_number || oldEmi.vehicle_number,
            operationType: "EMI",
            entityType: "FINANCE_EMI",
            entityId: String(id),
            action: "UPDATE",
            title: "EMI details updated",
            description,
            oldValue: oldEmi,
            newValue: { ...oldEmi, ...updateData },
            performedByName: data.performedByName || "Admin User",
            source: "emi",
            metadata: { vehicle_number: updateData.vehicle_number || oldEmi.vehicle_number },
          });
        }

        resolve({ status: true, message: "EMI entry updated successfully" });
      } else {
        resolve({ status: false, message: "EMI not found or unchanged" });
      }
    } catch (error) {
      console.error("Error updating EMI:", error);
      reject({ status: false, message: "Database error while updating EMI" });
    }
  });
}

// ✅ Delete EMI entry
export function deleteEmiModel(ids) {
  return new Promise(async (resolve, reject) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return reject({ status: false, message: "No IDs provided for deletion" });
    }

    try {
      const placeholders = ids.map(() => "?").join(",");
      const oldRecords = await executeQuery(`SELECT * FROM emi_master WHERE id IN (${placeholders})`, ids);

      const deleteQuery = `DELETE FROM emi_master WHERE id IN (${placeholders})`;
      const result = await executeQuery(deleteQuery, ids);

      if (result.affectedRows > 0) {
        if (Array.isArray(oldRecords)) {
          for (const emi of oldRecords) {
            await logFleetActivity({
              fleetId: emi.fleetId || null,
              vehicleNo: emi.vehicle_number,
              operationType: "EMI",
              entityType: "FINANCE_EMI",
              entityId: String(emi.id),
              action: "DELETE",
              title: "EMI record removed",
              description: `EMI record for ${emi.bank_name || emi.loan_name || "loan"} deleted for vehicle ${emi.vehicle_number || "fleet"}`,
              oldValue: emi,
              newValue: null,
              changedFields: ["deleted"],
              performedByName: "Admin User",
              source: "emi",
            });
          }
        }

        resolve({
          status: true,
          message: `${result.affectedRows} EMI entr${
            result.affectedRows > 1 ? "ies" : "y"
          } deleted successfully`,
        });
      } else {
        resolve({
          status: false,
          message: "No EMI entries found for given IDs",
        });
      }
    } catch (error) {
      console.error("Error deleting EMIs:", error);
      reject({
        status: false,
        message: "Database error while deleting EMIs",
      });
    }
  });
}
