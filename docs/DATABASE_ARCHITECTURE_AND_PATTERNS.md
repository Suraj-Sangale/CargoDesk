# CargoDesk Database Architecture & Query Guidelines

> **Audience**: Developers and AI Coding Assistants (Antigravity / Gemini / Copilot)  
> **Purpose**: Complete reference guide for database schemas, primary ID relationships (`fleet_id`), cross-table collation safety, audit logging, and standard query patterns.

---

## 1. Core Architecture Principles

### 1.1 Primary Key Relationship (`fleet_id`)
* **Primary Source of Truth**: The `fleets.id` (`INT AUTO_INCREMENT PRIMARY KEY`) is the unique identifier for all vehicles.
* **Child Tables**: All vehicle-linked tables (`vehicle_documents`, `emi_master`, `drivers`, `fleet_activity_history`) maintain a `fleet_id INT NULL` column.
* **Dual-Resolution Protocol**:
  1. Frontend forms should prioritize sending `fleet_id` (or `fleetId`).
  2. Backend models should save `fleet_id` and maintain `vehicleNo` / `vehicle_number` for quick display without joins.
  3. If only `fleet_id` is supplied, backend does a single fallback lookup to resolve `vehicle_number`.
  4. If only `vehicle_number` is supplied, backend resolves `fleet_id` by matching cleaned vehicle strings.

```
       +------------------------------------+
       |              fleets                |
       |  id (PK, INT)                      |
       |  vehicle_number (VARCHAR)          |
       +-----------------+------------------+
                         |
      +------------------+------------------+------------------+
      |                  |                  |                  |
      v                  v                  v                  v
+---------------+  +---------------+  +---------------+  +--------------------------+
|vehicle_docs   |  |  emi_master   |  |    drivers    |  | fleet_activity_history   |
|fleet_id (FK)  |  | fleet_id (FK) |  | fleet_id (FK) |  | fleet_id (FK)            |
|vehicleNo      |  | vehicle_number|  | assigned_veh  |  | entity_type, action      |
+---------------+  +---------------+  +---------------+  +--------------------------+
```

---

## 2. Critical Database Gotchas & Solutions

### 2.1 Collation Mismatch (`ER_CANT_AGGREGATE_2COLLATIONS`)
* **Problem**: In MariaDB/MySQL, different tables or default character sets may have varying collations (e.g., `utf8mb4_general_ci` vs `utf8mb4_uca1400_ai_ci`). Cross-table string joins like `WHERE vd.vehicleNo = f.vehicle_number` will throw:
  ```
  Error 1267 (HY000): Illegal mix of collations (utf8mb4_general_ci,IMPLICIT) and (utf8mb4_uca1400_ai_ci,IMPLICIT) for operation '='
  ```
* **Mandatory Rule for All Joins & Where Clauses**:
  1. Always prioritize integer join `vd.fleet_id = f.id`.
  2. For fallback string comparison, strip spaces/hyphens and **always append `COLLATE utf8mb4_general_ci`**:

```sql
-- Standard Safe Join Pattern
LEFT JOIN fleets f ON (
  (vd.fleet_id IS NOT NULL AND vd.fleet_id = f.id)
  OR (
    vd.fleet_id IS NULL 
    AND REPLACE(REPLACE(vd.vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
        REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
  )
)
```

---

## 3. Database Table Schemas

### 3.1 `fleets`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PK` | Primary vehicle ID |
| `vehicle_number` | `VARCHAR(50) UNIQUE` | Vehicle registration (e.g., `MH 14 YZ 8901`) |
| `vehicle_model` | `VARCHAR(100)` | Model name (e.g., `Tata Signa 4825.TK`) |
| `vehicle_type` | `VARCHAR(100)` | Vehicle category (e.g., `Heavy Truck (16-25T)`) |
| `capacity` | `VARCHAR(50)` | Load carrying capacity |
| `fuel_type` | `VARCHAR(50)` | Fuel type (Diesel, CNG, Electric) |
| `ownership_type` | `VARCHAR(50)` | Owned, Leased, Attached |
| `status` | `VARCHAR(50)` | `Active`, `Maintenance`, `Inactive` |
| `notes` | `TEXT` | Operational / maintenance notes |
| `created_at` / `updated_at` | `TIMESTAMP` | Record timestamps |

### 3.2 `vehicle_documents`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PK` | Document ID |
| `fleet_id` | `INT NULL` | Associated vehicle ID in `fleets` |
| `vehicleNo` | `VARCHAR(50) NULL` | Denormalized vehicle number |
| `documentType` | `VARCHAR(50)` | `rc`, `insurance`, `puc`, `fitness`, `permit` |
| `expiryDate` | `VARCHAR(50)` | Document expiry ISO date string |
| `alertDate` | `VARCHAR(50)` | Alert trigger date (30 days before expiry) |
| `isInAlertDate` | `TINYINT(1)` | `1` if within alert threshold |
| `note` | `TEXT` | Notes & certificate policy numbers |
| `createdAt` / `updatedAt` | `TIMESTAMP` | Record timestamps |

### 3.3 `emi_master`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PK` | EMI / Loan record ID |
| `fleet_id` | `INT NULL` | Associated vehicle ID in `fleets` |
| `vehicle_number` | `VARCHAR(50)` | Vehicle registration number |
| `loan_name` | `VARCHAR(255)` | Loan title / vehicle identifier |
| `bank_name` | `VARCHAR(100)` | Financier / Bank (HDFC, ICICI, etc.) |
| `loan_account_no` | `VARCHAR(100)` | Bank loan account number |
| `loan_amount` | `DECIMAL / VARCHAR` | Principal loan amount |
| `down_payment` | `DECIMAL(12,2)` | Initial down payment |
| `emi_amount` | `DECIMAL / VARCHAR` | Monthly EMI installment |
| `interest_rate` | `DECIMAL(5,2)` | Annual interest rate percentage |
| `tenure_months` | `INT` | Total tenure in months |
| `emis_paid` | `INT` | Number of installments paid |
| `start_date` / `due_date` | `VARCHAR(50)` | Loan start and monthly due dates |
| `payment_mode` | `VARCHAR(50)` | NACH, Auto-Debit, Bank Transfer |
| `status` | `INT / VARCHAR` | `1` (Active) or `0` (Completed) |

### 3.4 `drivers`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PK` | Driver ID |
| `driver_name` | `VARCHAR(100)` | Full name of driver |
| `contact_number` | `VARCHAR(30)` | Primary phone number |
| `license_number` | `VARCHAR(50) UNIQUE` | Driving license number |
| `license_type` | `VARCHAR(100)` | HTV, LMV, Commercial |
| `license_expiry` | `VARCHAR(30)` | License validity date |
| `fleet_id` | `INT NULL` | Currently assigned vehicle ID |
| `status` | `VARCHAR(50)` | `Active`, `On Duty`, `On Leave` |

### 3.5 `fleet_activity_history`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT PK` | Activity audit log ID |
| `fleet_id` | `INT NOT NULL` | Associated fleet vehicle ID |
| `operation_type` | `VARCHAR(50)` | `FLEET`, `DOCUMENT`, `DRIVER`, `EMI`, `MAINTENANCE`, `STATUS` |
| `entity_type` | `VARCHAR(50)` | `VEHICLE_INFO`, `INSURANCE`, `PUC`, `FITNESS`, `DRIVER_ALLOCATION`, `FINANCE_EMI`, `STATUS_CHANGE` |
| `entity_id` | `VARCHAR(50)` | ID of the entity that was affected |
| `action` | `VARCHAR(50)` | `CREATE`, `UPDATE`, `DELETE`, `UPLOAD`, `RENEW`, `ASSIGN`, `UNASSIGN` |
| `title` | `VARCHAR(255)` | Short headline for timeline |
| `description` | `TEXT` | Detailed change summary |
| `old_value` / `new_value` | `LONGTEXT / JSON` | Snapshots for audit diff inspection |
| `changed_fields` | `TEXT / JSON` | Array of modified key names |
| `performed_by_name` | `VARCHAR(100)` | User who executed the action |
| `performed_at` | `TIMESTAMP` | Timestamp of event |
| `source` | `VARCHAR(50)` | Originating module (`fleets`, `documents`, `emi`, `driver`) |
| `metadata` | `LONGTEXT / JSON` | Extra context (vehicleNo, model, etc.) |

---

## 4. Centralized Fleet Activity Audit Logging

### 4.1 Invoking the Logger
All CRUD operations in models must call `logFleetActivity` non-blockingly:

```javascript
import { logFleetActivity } from "./fleetActivityModel";

// In any create/update/delete method:
logFleetActivity({
  fleetId: fleetId || null,
  vehicleNo: vehicle_number,
  operationType: "DOCUMENT", // 'DOCUMENT' | 'DRIVER' | 'EMI' | 'FLEET' | 'MAINTENANCE' | 'STATUS'
  entityType: (documentType || "DOCUMENT").toUpperCase(),
  entityId: String(docId),
  action: "UPLOAD",          // 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'RENEW' | 'ASSIGN'
  title: `${documentType} uploaded`,
  description: `Document expiry: ${formattedExpiry}`,
  oldValue: oldDoc || null,
  newValue: updatedDoc,
  changedFields: Object.keys(updatedDoc),
  performedByName: performedByName || "Admin User",
  source: "documents",
  metadata: { fleet_id: fleetId, vehicleNo, documentType },
}).catch((err) => console.error("Error logging activity:", err));
```

### 4.2 Category Filter Mapping Rules
When filtering `fleet_activity_history` by category in `getFleetActivityHistoryModel`:
* `type = "DOCUMENTS"` or `"DOCUMENT"` -> matches `operation_type = 'DOCUMENT'`
* `type = "DRIVERS"` or `"DRIVER"` -> matches `operation_type = 'DRIVER'`
* `type = "EMIS"` or `"EMI"` -> matches `operation_type = 'EMI'`
* `type = "VEHICLE_DETAILS"` / `"FLEET"` -> matches `operation_type = 'FLEET'`
* `type = "STATUS"` -> matches `operation_type = 'STATUS' OR action IN ('ACTIVATE', 'DEACTIVATE')`

### 4.3 Self-Healing Auto-Sync in `getFleetByIdModel`
To ensure existing / seeded records appear in the audit trail without manual intervention, `getFleetByIdModel` automatically checks and backfills missing activity records for:
1. Assigned drivers
2. Uploaded documents
3. Active EMI financing plans

---

## 5. Standard Query Templates

### 5.1 Fetch Fleet by ID with Related Tabs
```javascript
const [fleetRows, docRows, emiRows, driverRes, maintRes] = await Promise.all([
  executeQuery(`
    SELECT f.*, d.id AS driver_id, d.driver_name, d.contact_number AS driver_contact
    FROM fleets f
    LEFT JOIN drivers d ON d.fleet_id = f.id
    WHERE f.id = ?
    LIMIT 1
  `, [fleetId]),

  executeQuery(`
    SELECT * FROM vehicle_documents 
    WHERE fleet_id = ? 
       OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = REPLACE(REPLACE(?, ' ', ''), '-', '') COLLATE utf8mb4_general_ci)
    ORDER BY id DESC
  `, [fleetId, vehicleNumber]),

  executeQuery(`
    SELECT * FROM emi_master 
    WHERE (fleet_id IS NOT NULL AND fleet_id = ?) 
       OR (fleet_id IS NULL AND REPLACE(REPLACE(vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = REPLACE(REPLACE(?, ' ', ''), '-', '') COLLATE utf8mb4_general_ci)
    ORDER BY id DESC
  `, [fleetId, vehicleNumber]),

  executeQuery(`SELECT COUNT(*) AS total FROM drivers WHERE fleet_id = ?`, [fleetId]),
  executeQuery(`SELECT COUNT(*) AS total FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'MAINTENANCE'`, [fleetId]),
]);
```

### 5.2 Fetch All Documents with Fleet Vehicle Metadata
```sql
SELECT 
  vd.*,
  COALESCE(vd.fleet_id, f.id) AS fleet_id,
  COALESCE(f.vehicle_number, vd.vehicleNo) AS vehicleNo,
  f.vehicle_model,
  f.vehicle_type,
  f.status AS vehicle_status
FROM vehicle_documents vd
LEFT JOIN fleets f ON (
  (vd.fleet_id IS NOT NULL AND vd.fleet_id = f.id)
  OR (
    vd.fleet_id IS NULL 
    AND REPLACE(REPLACE(vd.vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
        REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
  )
)
ORDER BY vd.id DESC;
```

### 5.3 Fetch All EMIs with Fleet Vehicle Metadata
```sql
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
ORDER BY e.created_at DESC;
```

---

## 6. One-Time Database Maintenance SQL Scripts

If configuring a new environment or unifying database collations, run the following commands:

```sql
-- 1. Unify Table Character Sets & Collations
ALTER TABLE `fleets` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `vehicle_documents` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `emi_master` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `drivers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `fleet_activity_history` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. Ensure fleet_id columns exist
ALTER TABLE `vehicle_documents` ADD COLUMN IF NOT EXISTS `fleet_id` INT NULL AFTER `id`;
ALTER TABLE `emi_master` ADD COLUMN IF NOT EXISTS `fleet_id` INT NULL AFTER `id`;
ALTER TABLE `drivers` ADD COLUMN IF NOT EXISTS `fleet_id` INT NULL;

-- 3. Backfill fleet_id for legacy documents
UPDATE `vehicle_documents` vd
JOIN `fleets` f ON (
  REPLACE(REPLACE(vd.vehicleNo, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
  REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
)
SET vd.fleet_id = f.id
WHERE vd.fleet_id IS NULL;

-- 4. Backfill fleet_id for legacy EMIs
UPDATE `emi_master` e
JOIN `fleets` f ON (
  REPLACE(REPLACE(e.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
  REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
)
SET e.fleet_id = f.id
WHERE e.fleet_id IS NULL;
```
