import executeQuery from "@/helpers/dbConnection";
import { hashWithSHA256 } from "@/utilities/utils";
import { ALL_MODULE_IDS } from "@/utilities/organizationModules";

let isOrgTableInitialized = false;

export async function ensureOrganizationsTable() {
  if (isOrgTableInitialized) return;
  isOrgTableInitialized = true;

  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS organizations (
        orgId INT AUTO_INCREMENT PRIMARY KEY,
        orgName VARCHAR(150) NOT NULL,
        orgCode VARCHAR(50) NULL UNIQUE,
        contactEmail VARCHAR(150) NULL,
        contactPhone VARCHAR(30) NULL,
        address TEXT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await executeQuery(createTableQuery);

    // Check existing columns in organizations table before ALTER
    try {
      const orgCols = await executeQuery("SHOW COLUMNS FROM organizations");
      const orgColNames = (Array.isArray(orgCols) ? orgCols : []).map((c) => c.Field);
      if (!orgColNames.includes("allowedModules")) {
        await executeQuery("ALTER TABLE organizations ADD COLUMN allowedModules TEXT NULL");
      }
    } catch (_) {}

    // Check count, seed default primary organization if empty
    const countRes = await executeQuery(`SELECT COUNT(*) as total FROM organizations`);
    const count = countRes?.[0]?.total || 0;
    if (count === 0) {
      const defaultOrg = {
        orgName: "CargoDesk Logistics Hub",
        orgCode: "CD-MAIN",
        contactEmail: "admin@cargodesk.com",
        contactPhone: "+91 98200 11223",
        address: "HQ Logistics Center, Sector 18, Navi Mumbai, India",
        status: "Active",
      };
      const insRes = await executeQuery(`INSERT INTO organizations SET ?`, defaultOrg);
      const defaultOrgId = insRes.insertId;

      // Assign existing non-super_admin users to this default organization
      try {
        await executeQuery(
          "UPDATE users SET orgId = ? WHERE (orgId IS NULL OR orgId = 0) AND email != 'suraj@agnibyte.com'",
          [defaultOrgId]
        );
      } catch (_) {}
    }
  } catch (err) {
    console.warn("ensureOrganizationsTable notice:", err?.message);
  }
}

export function getAllOrganizationsModel() {
  return new Promise(async (resolve) => {
    try {
      await ensureOrganizationsTable();

      const sql = `
        SELECT 
          o.*,
          COUNT(DISTINCT u.userId) as memberCount,
          COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.userId END) as adminCount
        FROM organizations o
        LEFT JOIN users u ON u.orgId = o.orgId
        GROUP BY o.orgId
        ORDER BY o.orgId ASC
      `;
      const rows = await executeQuery(sql);

      const parsedRows = (Array.isArray(rows) ? rows : []).map((org) => {
        let modules = [];
        if (org.allowedModules) {
          try {
            modules =
              typeof org.allowedModules === "string"
                ? JSON.parse(org.allowedModules)
                : org.allowedModules;
          } catch (_) {
            modules = String(org.allowedModules)
              .split(",")
              .map((m) => m.trim());
          }
        } else {
          modules = ALL_MODULE_IDS;
        }

        return {
          ...org,
          allowedModules: Array.isArray(modules) && modules.length > 0 ? modules : ALL_MODULE_IDS,
        };
      });

      resolve({
        status: true,
        data: parsedRows,
        message: "Organizations fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      resolve({
        status: true,
        data: [
          {
            orgId: 1,
            orgName: "CargoDesk Logistics Hub",
            orgCode: "CD-MAIN",
            contactEmail: "admin@cargodesk.com",
            contactPhone: "+91 98200 11223",
            address: "Logistics Center, Mumbai",
            status: "Active",
            memberCount: 3,
            adminCount: 1,
          },
        ],
        message: "Fallback organization data",
      });
    }
  });
}

export function createOrganizationModel(data) {
  return new Promise(async (resolve) => {
    try {
      await ensureOrganizationsTable();

      const orgName = (data.orgName || "").trim();
      if (!orgName) {
        return resolve({ status: false, message: "Organization name is required" });
      }

      const orgCode = (data.orgCode || orgName.substring(0, 4).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900)).trim();

      let allowedModulesStr = null;
      if (data.allowedModules) {
        allowedModulesStr =
          typeof data.allowedModules === "string"
            ? data.allowedModules
            : JSON.stringify(data.allowedModules);
      } else {
        allowedModulesStr = JSON.stringify(ALL_MODULE_IDS);
      }

      const newOrg = {
        orgName,
        orgCode,
        contactEmail: (data.contactEmail || "").trim(),
        contactPhone: (data.contactPhone || "").trim(),
        address: (data.address || "").trim(),
        status: data.status || "Active",
        allowedModules: allowedModulesStr,
      };

      const result = await executeQuery(`INSERT INTO organizations SET ?`, newOrg);

      if (result && result.affectedRows > 0) {
        const orgId = result.insertId;

        // Auto-create an Admin user for this organization:
        // Organization name with suffix " - Admin" (e.g. "Raj Transport - Admin")
        // Same contact details as organization
        let adminUserCreated = null;
        try {
          const rawEmail = (data.contactEmail || "").trim().toLowerCase();
          const cleanOrgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, "") || `org${orgId}`;
          let adminEmail = rawEmail;

          // If no contact email was provided, generate a clean default
          if (!adminEmail) {
            adminEmail = `${cleanOrgSlug}.admin@cargodesk.com`;
          }

          // Ensure email is unique in users table
          const existingUser = await executeQuery(
            `SELECT userId FROM users WHERE LOWER(email) = ?`,
            [adminEmail]
          );

          if (existingUser && existingUser.length > 0) {
            adminEmail = `${cleanOrgSlug}_admin_${orgId}@cargodesk.com`;
          }

          const defaultAdminPermissions = JSON.stringify([
            "dashboard",
            "documents",
            "fleets",
            "drivers",
            "invoice",
            "dailyorders",
            "users",
          ]);

          const adminUser = {
            firstName: orgName.slice(0, 50).trim(),
            lastName: "- Admin",
            email: adminEmail,
            phone: (data.contactPhone || "").trim().slice(0, 20) || null,
            role: "admin",
            orgId: orgId,
            status: "1",
            password: hashWithSHA256("CargoDesk@2025"),
            permissions: defaultAdminPermissions,
          };

          const userInsertResult = await executeQuery(`INSERT INTO users SET ?`, adminUser);
          if (userInsertResult && userInsertResult.affectedRows > 0) {
            adminUserCreated = {
              userId: userInsertResult.insertId,
              fullName: `${adminUser.firstName} ${adminUser.lastName}`,
              email: adminEmail,
              role: "admin",
            };
          }
        } catch (userErr) {
          console.error("Auto admin user creation notice:", userErr?.message);
        }

        resolve({
          status: true,
          message: adminUserCreated
            ? `Organization and Admin user "${orgName} - Admin" created successfully`
            : "Organization created successfully",
          orgId: orgId,
          adminUser: adminUserCreated,
        });
      } else {
        resolve({ status: false, message: "Failed to create organization" });
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      resolve({
        status: false,
        message: error?.message || "Error creating organization",
      });
    }
  });
}

export function updateOrganizationModel(data) {
  return new Promise(async (resolve) => {
    try {
      await ensureOrganizationsTable();

      const orgId = Number(data.orgId);
      if (!orgId || isNaN(orgId)) {
        return resolve({ status: false, message: "Valid organization ID required" });
      }

      const updateFields = {};
      if (data.orgName !== undefined) updateFields.orgName = data.orgName.trim();
      if (data.orgCode !== undefined) updateFields.orgCode = data.orgCode.trim();
      if (data.contactEmail !== undefined) updateFields.contactEmail = data.contactEmail.trim();
      if (data.contactPhone !== undefined) updateFields.contactPhone = data.contactPhone.trim();
      if (data.address !== undefined) updateFields.address = data.address.trim();
      if (data.status !== undefined) updateFields.status = data.status;
      if (data.allowedModules !== undefined) {
        updateFields.allowedModules =
          typeof data.allowedModules === "string"
            ? data.allowedModules
            : JSON.stringify(data.allowedModules);
      }

      const result = await executeQuery(`UPDATE organizations SET ? WHERE orgId = ?`, [updateFields, orgId]);

      if (result && result.affectedRows >= 0) {
        resolve({ status: true, message: "Organization updated successfully" });
      } else {
        resolve({ status: false, message: "Failed to update organization" });
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      resolve({ status: false, message: error?.message || "Error updating organization" });
    }
  });
}

export function deleteOrganizationModel(orgId) {
  return new Promise(async (resolve) => {
    try {
      const id = Number(orgId);
      if (!id || isNaN(id)) {
        return resolve({ status: false, message: "Valid organization ID required" });
      }

      const result = await executeQuery(`DELETE FROM organizations WHERE orgId = ?`, [id]);
      if (result && result.affectedRows > 0) {
        // Detach users from deleted organization
        try {
          await executeQuery(`UPDATE users SET orgId = NULL WHERE orgId = ?`, [id]);
        } catch (_) {}

        resolve({ status: true, message: "Organization deleted successfully" });
      } else {
        resolve({ status: false, message: "Organization not found" });
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      resolve({ status: false, message: error?.message || "Error deleting organization" });
    }
  });
}
