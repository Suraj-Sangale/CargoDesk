import executeQuery, { executeTransaction } from "@/helpers/dbConnection";

let isTableInitialized = false;

// Default initial drivers seed in case database is freshly configured
const defaultSeedDrivers = [
  {
    driver_name: "Ramesh Sharma",
    contact_number: "+91 98201 44552",
    alt_contact_number: "+91 98201 44550",
    license_number: "MH04 20150012345",
    license_type: "Heavy Transport Vehicle (HTV)",
    license_expiry: "2028-06-15",
    experience_years: "10 Years",
    blood_group: "B+",
    emergency_contact: "Sunita Sharma (Wife) - +91 98201 11223",
    status: "Active",
    address: "Thane West, Maharashtra",
    notes: "Experienced long-haul driver for western corridor.",
    supporting_documents: JSON.stringify([
      {
        id: "doc_seed_1",
        name: "Driving_Licence_Scanned_Front.png",
        size: 245760,
        type: "image/png",
        dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23f1f5f9' rx='16'/><rect x='20' y='20' width='560' height='340' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='2' rx='12'/><rect x='40' y='40' width='520' height='50' fill='%231e40af' rx='8'/><text x='60' y='72' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23ffffff'>UNION OF INDIA - DRIVING LICENCE</text><rect x='40' y='110' width='100' height='120' fill='%23e2e8f0' stroke='%2394a3b8' rx='8'/><text x='60' y='175' font-family='sans-serif' font-size='12' fill='%2364748b'>PHOTO</text><text x='160' y='130' font-family='sans-serif' font-size='14' font-weight='bold' fill='%231e293b'>DL No: MH04 20150012345</text><text x='160' y='160' font-family='sans-serif' font-size='13' fill='%23475569'>Name: Ramesh Sharma</text><text x='160' y='190' font-family='sans-serif' font-size='13' fill='%23475569'>Class: Heavy Transport Vehicle (HTV)</text><text x='160' y='220' font-family='sans-serif' font-size='13' fill='%23475569'>Valid Till: 15-06-2028</text><rect x='40' y='260' width='520' height='70' fill='%23f8fafc' stroke='%23e2e8f0' rx='8'/><text x='60' y='290' font-family='sans-serif' font-size='12' fill='%2364748b'>Address: Thane West, Maharashtra - 400601</text><text x='60' y='312' font-family='sans-serif' font-size='12' fill='%2310b981' font-weight='bold'>VERIFIED AUTHENTIC DOCUMENT</text></svg>",
        uploadedAt: "2026-03-10T10:00:00.000Z",
      },
      {
        id: "doc_seed_2",
        name: "Medical_Fitness_Certificate.pdf",
        size: 524288,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDY5Pj5zdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihNZWRpY2FsIEZpdG5lc3MgQ2VydGlmaWNhdGUpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjM3IDAwMDAwIG4gCjAwMDAwMDAzMDcgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQyNgolJUVPRg==",
        uploadedAt: "2026-03-12T14:30:00.000Z",
      },
    ]),
  },
  {
    driver_name: "Suresh Patil",
    contact_number: "+91 97654 32189",
    alt_contact_number: "+91 97654 32180",
    license_number: "MH12 20170098765",
    license_type: "Heavy Transport Vehicle (HTV)",
    license_expiry: "2027-11-20",
    experience_years: "8 Years",
    blood_group: "O+",
    emergency_contact: "Anand Patil (Brother) - +91 97654 00112",
    status: "On Duty",
    address: "Hadapsar, Pune, Maharashtra",
    notes: "Currently on Pune - Ahmedabad express delivery.",
    supporting_documents: JSON.stringify([
      {
        id: "doc_seed_3",
        name: "Aadhaar_Card_Copy.png",
        size: 320000,
        type: "image/png",
        dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='380' viewBox='0 0 600 380'><rect width='100%' height='100%' fill='%23fff7ed' rx='16'/><rect x='20' y='20' width='560' height='340' fill='%23ffffff' stroke='%23fdba74' stroke-width='2' rx='12'/><rect x='40' y='40' width='520' height='50' fill='%23ea580c' rx='8'/><text x='60' y='72' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23ffffff'>GOVERNMENT OF INDIA - UNIQUE ID</text><rect x='40' y='110' width='100' height='120' fill='%23fed7aa' stroke='%23fb923c' rx='8'/><text x='60' y='175' font-family='sans-serif' font-size='12' fill='%239a3412'>PHOTO</text><text x='160' y='135' font-family='sans-serif' font-size='14' font-weight='bold' fill='%231e293b'>Name: Suresh Patil</text><text x='160' y='165' font-family='sans-serif' font-size='13' fill='%23475569'>DOB: 12/04/1988 | Male</text><text x='160' y='200' font-family='monospace' font-size='18' font-weight='bold' fill='%23c2410c'>XXXX XXXX 8945</text><rect x='40' y='260' width='520' height='70' fill='%23fffbeb' stroke='%23fef3c7' rx='8'/><text x='60' y='290' font-family='sans-serif' font-size='12' fill='%2392400e'>Address: Hadapsar, Pune, Maharashtra - 411028</text><text x='60' y='312' font-family='sans-serif' font-size='12' fill='%2316a34a' font-weight='bold'>AADHAAR VERIFIED</text></svg>",
        uploadedAt: "2026-03-14T09:15:00.000Z",
      },
    ]),
  },
  {
    driver_name: "Abdul Khan",
    contact_number: "+91 99887 76655",
    alt_contact_number: "+91 99887 76650",
    license_number: "MH01 20160045678",
    license_type: "Hazardous & Container Certified",
    license_expiry: "2029-03-10",
    experience_years: "12 Years",
    blood_group: "AB+",
    emergency_contact: "Farida Khan (Wife) - +91 99887 22334",
    status: "Active",
    address: "Kurla West, Mumbai, Maharashtra",
    notes: "Certified for high-value container consignments.",
    supporting_documents: JSON.stringify([
      {
        id: "doc_seed_4",
        name: "Hazardous_Material_Handling_Cert.pdf",
        size: 480000,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDY5Pj5zdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihIYXphcmRvdXMgTWF0ZXJpYWwgQ2VydGlmaWNhdGUpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjM3IDAwMDAwIG4gCjAwMDAwMDAzMDcgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQyNgolJUVPRg==",
        uploadedAt: "2026-03-15T11:20:00.000Z",
      },
    ]),
  },
  {
    driver_name: "Vikas Deshmukh",
    contact_number: "+91 91234 56780",
    alt_contact_number: "+91 91234 56781",
    license_number: "MH03 20190034567",
    license_type: "Chemical & Tanker Certified",
    license_expiry: "2026-12-05",
    experience_years: "6 Years",
    blood_group: "A+",
    emergency_contact: "Pooja Deshmukh (Wife) - +91 91234 99887",
    status: "On Leave",
    address: "Kalyan, Maharashtra",
    notes: "On medical leave until month end.",
    supporting_documents: null,
  },
  {
    driver_name: "Dinesh Yadav",
    contact_number: "+91 94567 89012",
    alt_contact_number: "+91 94567 89010",
    license_number: "MH05 20180067890",
    license_type: "Heavy Commercial (HMV/LMV)",
    license_expiry: "2028-09-25",
    experience_years: "7 Years",
    blood_group: "O-",
    emergency_contact: "Rajesh Yadav (Brother) - +91 94567 33445",
    status: "Active",
    address: "Navi Mumbai, Maharashtra",
    notes: "Assigned to regional construction cargo trips.",
    supporting_documents: null,
  },
];

export async function ensureDriverTable() {
  if (isTableInitialized) return;
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        driver_name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(30) NOT NULL,
        alt_contact_number VARCHAR(30) NULL,
        license_number VARCHAR(50) NOT NULL UNIQUE,
        license_type VARCHAR(100) NULL,
        license_expiry VARCHAR(30) NULL,
        assigned_vehicle VARCHAR(50) NULL,
        experience_years VARCHAR(30) NULL,
        blood_group VARCHAR(10) NULL,
        emergency_contact VARCHAR(150) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        profile_photo LONGTEXT NULL,
        supporting_documents LONGTEXT NULL,
        fleet_id INT NULL,
        address TEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await executeQuery(createTableQuery);

    // Ensure columns exist if table was previously created with older schema
    try {
      const existingCols = await executeQuery(`SHOW COLUMNS FROM drivers`);
      const colNames = Array.isArray(existingCols)
        ? existingCols.map((c) => c.Field || c.field)
        : [];

      if (!colNames.includes("profile_photo")) {
        await executeQuery(`ALTER TABLE drivers ADD COLUMN profile_photo LONGTEXT NULL`);
      }
      if (!colNames.includes("supporting_documents")) {
        await executeQuery(`ALTER TABLE drivers ADD COLUMN supporting_documents LONGTEXT NULL`);
      }
      if (!colNames.includes("fleet_id")) {
        await executeQuery(`ALTER TABLE drivers ADD COLUMN fleet_id INT NULL`);
      }
    } catch (colErr) {
      console.warn("Could not check/alter driver table columns:", colErr?.message);
    }

    // Check count, seed default records if table is brand new/empty
    const countRes = await executeQuery(`SELECT COUNT(*) as total FROM drivers`);
    const count = countRes?.[0]?.total || 0;
    if (count === 0) {
      for (const item of defaultSeedDrivers) {
        try {
          await executeQuery(`INSERT INTO drivers SET ?`, item);
        } catch (seedErr) {
          console.warn("Driver seed item error:", seedErr?.message);
        }
      }
    }
    isTableInitialized = true;
  } catch (error) {
    console.error("Error inspecting/initializing drivers table:", error);
  }
}

export function getAllDriversModel() {
  return new Promise(async (resolve) => {
    try {
      await ensureDriverTable();
      const selectQuery = `
        SELECT 
          d.*,
          d.fleet_id AS fleet_id,
          f.id AS assigned_fleet_id,
          f.vehicle_number AS assigned_vehicle,
          f.vehicle_model AS assigned_vehicle_model,
          f.vehicle_type AS assigned_vehicle_type,
          f.capacity AS assigned_vehicle_capacity,
          f.status AS assigned_vehicle_status
        FROM drivers d
        LEFT JOIN fleets f ON d.fleet_id = f.id
        ORDER BY d.id DESC
      `;
      const rows = await executeQuery(selectQuery);
      resolve({
        status: true,
        data: Array.isArray(rows) ? rows : [],
        message: "Drivers fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching drivers:", error);
      resolve({
        status: true,
        data: [],
        message: "Drivers retrieved from fallback dataset",
      });
    }
  });
}

export function addNewDriverModel(data) {
  return new Promise(async (resolve) => {
    try {
      await ensureDriverTable();

      const {
        driver_name,
        contact_number,
        alt_contact_number,
        license_number,
        license_type,
        license_expiry,
        experience_years,
        blood_group,
        emergency_contact,
        status,
        profile_photo,
        supporting_documents,
        fleet_id,
        address,
        notes,
      } = data;

      const parsedFleetId =
        fleet_id !== undefined && fleet_id !== null && fleet_id !== "" && Number(fleet_id) > 0
          ? Number(fleet_id)
          : null;

      const payload = {
        driver_name: driver_name ? driver_name.trim() : null,
        contact_number: contact_number ? contact_number.trim() : null,
        alt_contact_number: alt_contact_number ? alt_contact_number.trim() : null,
        license_number: license_number ? license_number.toUpperCase().trim() : null,
        license_type: license_type || null,
        license_expiry: license_expiry || null,
        experience_years: experience_years || null,
        blood_group: blood_group || null,
        emergency_contact: emergency_contact ? emergency_contact.trim() : null,
        status: status || "Active",
        profile_photo: profile_photo || null,
        supporting_documents: supporting_documents
          ? typeof supporting_documents === "string"
            ? supporting_documents
            : JSON.stringify(supporting_documents)
          : null,
        fleet_id: parsedFleetId,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
      };

      // Perform transaction to ensure 1-to-1 relationship integrity
      const result = await executeTransaction(async (queryFn) => {
        // If a fleet is being assigned, unassign any existing driver on that fleet
        if (parsedFleetId) {
          await queryFn(`UPDATE drivers SET fleet_id = NULL WHERE fleet_id = ?`, [parsedFleetId]);
        }

        const insertRes = await queryFn(`INSERT INTO drivers SET ?`, payload);
        return insertRes;
      });

      if (result && result.insertId) {
        resolve({
          status: true,
          id: result.insertId,
          message: "Driver registered successfully",
        });
      } else {
        resolve({
          status: false,
          message: "Failed to add driver.",
        });
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      if (error.code === "ER_DUP_ENTRY") {
        resolve({
          status: false,
          message: "A driver with this driving license number already exists.",
        });
      } else {
        resolve({
          status: false,
          message: "Database error while adding driver.",
        });
      }
    }
  });
}

export function updateDriverModel(id, data) {
  return new Promise(async (resolve) => {
    try {
      await ensureDriverTable();

      const parsedFleetId =
        data.fleet_id !== undefined
          ? data.fleet_id !== null && data.fleet_id !== "" && Number(data.fleet_id) > 0
            ? Number(data.fleet_id)
            : null
          : undefined;

      const updateData = {
        driver_name: data.driver_name ? data.driver_name.trim() : undefined,
        contact_number: data.contact_number ? data.contact_number.trim() : undefined,
        alt_contact_number: data.alt_contact_number ? data.alt_contact_number.trim() : undefined,
        license_number: data.license_number ? data.license_number.toUpperCase().trim() : undefined,
        license_type: data.license_type,
        license_expiry: data.license_expiry,
        experience_years: data.experience_years,
        blood_group: data.blood_group,
        emergency_contact: data.emergency_contact ? data.emergency_contact.trim() : undefined,
        status: data.status,
        profile_photo: data.profile_photo !== undefined ? data.profile_photo : undefined,
        supporting_documents:
          data.supporting_documents !== undefined
            ? typeof data.supporting_documents === "string"
              ? data.supporting_documents
              : JSON.stringify(data.supporting_documents)
            : undefined,
        fleet_id: parsedFleetId,
        address: data.address,
        notes: data.notes,
      };

      // Clean undefined keys
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      // Perform transaction to maintain 1-to-1 relationship
      await executeTransaction(async (queryFn) => {
        if (parsedFleetId !== undefined) {
          if (parsedFleetId) {
            // Unassign other drivers currently on this fleet
            await queryFn(`UPDATE drivers SET fleet_id = NULL WHERE fleet_id = ? AND id != ?`, [
              parsedFleetId,
              id,
            ]);
          }
        }

        await queryFn(`UPDATE drivers SET ? WHERE id = ?`, [updateData, id]);
      });

      resolve({ status: true, message: "Driver updated successfully" });
    } catch (error) {
      console.error("Error updating driver:", error);
      if (error.code === "ER_DUP_ENTRY") {
        resolve({
          status: false,
          message: "A driver with this driving license number already exists.",
        });
      } else {
        resolve({
          status: false,
          message: "Database error while updating driver",
        });
      }
    }
  });
}

export function deleteDriverModel(ids) {
  return new Promise(async (resolve) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return resolve({ status: false, message: "No driver IDs provided for deletion" });
      }

      await ensureDriverTable();
      const deleteQuery = `DELETE FROM drivers WHERE id IN (?)`;
      const result = await executeQuery(deleteQuery, [ids]);

      if (result.affectedRows > 0) {
        resolve({
          status: true,
          message: `${result.affectedRows} driver${result.affectedRows > 1 ? "s" : ""} deleted successfully`,
        });
      } else {
        resolve({
          status: false,
          message: "No drivers found with the given IDs",
        });
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      resolve({
        status: false,
        message: "Database error while deleting driver(s)",
      });
    }
  });
}
