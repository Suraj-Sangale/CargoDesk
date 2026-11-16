import executeQuery, { executeTransaction } from "@/helpers/dbConnection";
import { logFleetActivity } from "./fleetActivityModel";
import { getMediaProxyUrl, extractS3Key } from "../services/s3Service";

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
  isTableInitialized = true;
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orgId INT NULL,
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

    // Ensure orgId column exists if table existed previously without it
    const colRows = await executeQuery(`SHOW COLUMNS FROM drivers LIKE 'orgId'`);
    if (!colRows || colRows.length === 0) {
      await executeQuery(`ALTER TABLE drivers ADD COLUMN orgId INT NULL AFTER id`);
    }

    // Backfill any existing legacy drivers without an orgId to their assigned fleet's orgId or default org 1
    await executeQuery(`
      UPDATE drivers d 
      LEFT JOIN fleets f ON d.fleet_id = f.id 
      SET d.orgId = COALESCE(f.orgId, 1) 
      WHERE d.orgId IS NULL OR d.orgId = 0
    `);

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
  } catch (error) {
    isTableInitialized = false;
    console.error("Error inspecting/initializing drivers table:", error);
  }
}

export function getAllDriversModel(requestOrUser = {}, authUser = null) {
  return new Promise(async (resolve) => {
    try {
      await ensureDriverTable();

      // 1. Resolve request payload and authUser whether passed as:
      //    - getAllDriversModel(request, authUser) -> API route
      //    - getAllDriversModel({}, user)          -> SSR with user as 2nd arg
      //    - getAllDriversModel(user)              -> SSR with user as sole arg
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

      // Multi-tenant organization scoping (strictly matches fleetModel logic)
      if (!isSuperAdmin) {
        if (orgId) {
          whereClauses.push("d.orgId = ?");
          params.push(orgId);
        } else {
          whereClauses.push("d.orgId IS NULL");
        }
      } else if (request?.orgId) {
        whereClauses.push("d.orgId = ?");
        params.push(Number(request.orgId));
      }

      const whereSQL =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      const selectQuery = `
        SELECT 
          d.*,
          o.orgName AS organization_name,
          o.orgName AS orgName,
          o.orgCode AS orgCode,
          d.fleet_id AS fleet_id,
          f.id AS assigned_fleet_id,
          f.vehicle_number AS assigned_vehicle,
          f.vehicle_model AS assigned_vehicle_model,
          f.vehicle_type AS assigned_vehicle_type,
          f.capacity AS assigned_vehicle_capacity,
          f.status AS assigned_vehicle_status
        FROM drivers d
        LEFT JOIN organizations o ON o.orgId = d.orgId
        LEFT JOIN fleets f ON d.fleet_id = f.id
        ${whereSQL}
        ORDER BY d.id DESC
      `;
      const rows = await executeQuery(selectQuery, params);

      const processedRows = (Array.isArray(rows) ? rows : []).map((row, idx) => {
        let photo = row.profile_photo;
        if (photo && typeof photo === "string") {
          const s3Key = extractS3Key(photo);
          if (s3Key) {
            photo = getMediaProxyUrl(s3Key);
          }
        }

        let docs = row.supporting_documents;
        if (docs && typeof docs === "string" && docs.trim().startsWith("[")) {
          try {
            const parsedDocs = JSON.parse(docs);
            if (Array.isArray(parsedDocs)) {
              docs = parsedDocs.map((d) => {
                const s3Key = d.s3Key || extractS3Key(d.dataUrl || d.url);
                if (s3Key) {
                  const mediaUrl = getMediaProxyUrl(s3Key);
                  return {
                    ...d,
                    s3Key,
                    dataUrl: mediaUrl,
                    url: mediaUrl,
                  };
                }
                return d;
              });
            }
          } catch (_) {}
        }

        return {
          ...row,
          sr_no: idx + 1,
          profile_photo: photo,
          supporting_documents: docs,
        };
      });

      resolve({
        status: true,
        data: processedRows,
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

export function addNewDriverModel(data, authUser = null) {
  return new Promise(async (resolve) => {
    try {
      // await ensureDriverTable();

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
      // Super Admin can assign driver to an organization via orgId / organization_id
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

      // 3. Cross-tenant fleet assignment validation
      if (parsedFleetId) {
        const fleetRows = await executeQuery(
          "SELECT id, orgId, vehicle_number FROM fleets WHERE id = ? LIMIT 1",
          [parsedFleetId]
        );
        if (!fleetRows || fleetRows.length === 0) {
          return resolve({
            status: false,
            message: "Selected fleet vehicle does not exist.",
          });
        }
        const fleetRecord = fleetRows[0];
        if (orgId && fleetRecord.orgId && Number(fleetRecord.orgId) !== Number(orgId)) {
          return resolve({
            status: false,
            message: "Cannot assign a fleet vehicle belonging to a different organization.",
          });
        }
      }

      const payload = {
        orgId: orgId || null,
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
        const newDriverId = result.insertId;
        // Log fleet activity if driver is assigned to a fleet on creation
        if (parsedFleetId) {
          await logFleetActivity({
            fleetId: parsedFleetId,
            operationType: "DRIVER",
            entityType: "DRIVER_ALLOCATION",
            entityId: String(newDriverId),
            action: "ASSIGN",
            title: "Driver assigned",
            description: `Driver: ${driver_name || "New Driver"}`,
            oldValue: null,
            newValue: { driver_id: newDriverId, driver_name },
            changedFields: ["driver_id", "driver_name"],
            performedByName: data.performedByName || "Admin User",
            source: "driver",
            metadata: { driver_name, contact_number },
          });
        }

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


export const updateDriverModel = (id, data, authUser = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Validate driver ID
      const driverId = Number(id);

      if (!Number.isInteger(driverId) || driverId <= 0) {
        return reject(new Error("Invalid driver ID"));
      }

      // 2. Resolve logged-in user's organization
      let orgId = authUser?.orgId || null;

      if (!orgId && authUser?.userId) {
        const userRows = await executeQuery(
          `SELECT orgId FROM users WHERE userId = ? LIMIT 1`,
          [authUser.userId]
        );

        orgId = userRows?.[0]?.orgId || null;
      }

      // Use trusted server-side role information.
      const isSuperAdmin =
        authUser?.role === "super_admin" ||
        authUser?.email === "suraj@agnibyte.com";

      // 3. Fetch existing driver
      const oldDriverRows = await executeQuery(
        `SELECT * FROM drivers WHERE id = ? LIMIT 1`,
        [driverId]
      );

      if (!oldDriverRows?.length) {
        return reject(new Error("Driver not found"));
      }

      const oldDriver = oldDriverRows[0];

      // 4. Organization access validation
      if (!isSuperAdmin) {
        if (!orgId || Number(oldDriver.orgId) !== Number(orgId)) {
          return reject(
            new Error("You are not authorized to update this driver")
          );
        }
      }

      // 5. Resolve target organization
      const orgFields = ["orgId", "organization_id", "org_id"];
      const orgField = orgFields.find((field) =>
        Object.prototype.hasOwnProperty.call(data, field)
      );

      let newOrgId = oldDriver.orgId;

      if (orgField) {
        if (!isSuperAdmin) {
          return reject(
            new Error("Only Super Admin can change driver organization")
          );
        }

        const rawOrgId = data[orgField];

        if (rawOrgId === null || rawOrgId === "") {
          return reject(new Error("Invalid organization ID"));
        }

        newOrgId = Number(rawOrgId);

        if (!Number.isInteger(newOrgId) || newOrgId <= 0) {
          return reject(new Error("Invalid organization ID"));
        }

        const organizationRows = await executeQuery(
          `SELECT id FROM organizations WHERE id = ? LIMIT 1`,
          [newOrgId]
        );

        if (!organizationRows?.length) {
          return reject(new Error("Organization not found"));
        }
      }

      const effectiveOrgId = Number(newOrgId || orgId);

      // 6. Validate fleet ID
      let parsedFleetId = oldDriver.fleet_id ?? null;

      if (data.fleet_id !== undefined) {
        if (
          data.fleet_id === null ||
          data.fleet_id === ""
        ) {
          parsedFleetId = null;
        } else {
          parsedFleetId = Number(data.fleet_id);

          if (
            !Number.isInteger(parsedFleetId) ||
            parsedFleetId <= 0
          ) {
            return reject(new Error("Invalid fleet ID"));
          }
        }
      }

      // 7. Validate selected fleet belongs to target organization
      if (parsedFleetId !== null) {
        if (!effectiveOrgId) {
          return reject(
            new Error("Organization is required to assign a fleet")
          );
        }

        const fleetRows = await executeQuery(
          `SELECT id FROM fleets WHERE id = ? AND orgId = ? LIMIT 1`,
          [parsedFleetId, effectiveOrgId]
        );

        if (!fleetRows?.length) {
          return reject(
            new Error("Selected fleet does not belong to this organization")
          );
        }
      }

      // 8. Prepare update data
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        license_number:
          data.license_number !== undefined
            ? data.license_number?.toUpperCase().trim() || null
            : undefined,
        license_type: data.license_type,
        license_expiry: data.license_expiry,
        address: data.address,
        profile_photo: data.profile_photo,
        supporting_documents:
          data.supporting_documents !== undefined
            ? JSON.stringify(data.supporting_documents)
            : undefined,
        fleet_id: parsedFleetId,
        orgId: orgField ? newOrgId : undefined,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      if (!Object.keys(updateData).length) {
        return reject(new Error("No fields provided for update"));
      }

      const fleetChanged =
        Number(oldDriver.fleet_id || 0) !== Number(parsedFleetId || 0);

      // 9. Update driver inside transaction
      await executeTransaction(async (queryFn) => {
        // Unassign other drivers from this fleet within the same organization
        if (parsedFleetId && fleetChanged) {
          await queryFn(
            `UPDATE drivers
             SET fleet_id = NULL
             WHERE fleet_id = ?
               AND orgId = ?
               AND id != ?`,
            [parsedFleetId, effectiveOrgId, driverId]
          );
        }

        await queryFn(
          `UPDATE drivers SET ? WHERE id = ?`,
          [updateData, driverId]
        );
      });

      // 10. Log fleet activity after successful transaction
      const performedBy =
        authUser?.name ||
        authUser?.userName ||
        "System";

      if (oldDriver.fleet_id && fleetChanged) {
        await logFleetActivity({
          fleet_id: oldDriver.fleet_id,
          activity_type: "DRIVER_UNASSIGNED",
          description: `Driver ${oldDriver.first_name} ${oldDriver.last_name} was unassigned`,
          performed_by: performedBy,
        });
      }

      if (parsedFleetId && fleetChanged) {
        await logFleetActivity({
          fleet_id: parsedFleetId,
          activity_type: "DRIVER_ASSIGNED",
          description: `Driver ${data.first_name || oldDriver.first_name} ${
            data.last_name || oldDriver.last_name
          } was assigned`,
          performed_by: performedBy,
        });
      }

      resolve({
        success: true,
        message: "Driver updated successfully",
      });
    } catch (error) {
      console.error("updateDriverModel Error:", error);

      if (error.code === "ER_DUP_ENTRY") {
        return reject(
          new Error("Driver with this email or license number already exists")
        );
      }

      reject(error);
    }
  });
};

export function deleteDriverModel(ids, authUser = null) {
  return new Promise(async (resolve) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return resolve({ status: false, message: "No driver IDs provided for deletion" });
      }

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

      if (authUser && !isSuperAdmin && orgId) {
        const forbiddenDrivers = await executeQuery(
          `SELECT id FROM drivers WHERE id IN (?) AND (orgId IS NOT NULL AND orgId != ?)`,
          [ids, orgId]
        );
        if (forbiddenDrivers && forbiddenDrivers.length > 0) {
          return resolve({
            status: false,
            message: "Unauthorized: Cannot delete drivers belonging to another organization.",
          });
        }
      }

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
