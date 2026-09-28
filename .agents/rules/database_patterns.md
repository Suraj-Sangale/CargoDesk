# Mandatory Database & Query Rules for CargoDesk

## 1. Primary ID Architecture (`fleet_id`)
* `fleets.id` (INT) is the primary source of truth for all vehicles.
* All child models (`vehicleDocumentModel.js`, `emiModel.js`, `driverModel.js`, `fleetActivityModel.js`) MUST store `fleet_id INT NULL`.
* Forms and controllers should pass `fleet_id` (or `fleetId`). Models must resolve `fleet_id` <-> `vehicle_number` if one is missing.

## 2. Collation Safety on Cross-Table String Joins
* Whenever joining or comparing `vehicle_number` / `vehicleNo` across tables (e.g., `vehicle_documents` / `emi_master` with `fleets`), ALWAYS include `COLLATE utf8mb4_general_ci` to prevent MariaDB error `ER_CANT_AGGREGATE_2COLLATIONS` (Error 1267):
```sql
LEFT JOIN fleets f ON (
  (table.fleet_id IS NOT NULL AND table.fleet_id = f.id)
  OR (
    table.fleet_id IS NULL 
    AND REPLACE(REPLACE(table.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci = 
        REPLACE(REPLACE(f.vehicle_number, ' ', ''), '-', '') COLLATE utf8mb4_general_ci
  )
)
```

## 3. Centralized Fleet Activity Audit Logging
* Any insert, update, or delete on vehicles, documents, EMIs, or drivers must trigger `logFleetActivity(...)` asynchronously and non-blockingly (`.catch(...)`).
* Category filters in `getFleetActivityHistoryModel` must support both singular and plural forms (`DOCUMENTS`/`DOCUMENT`, `DRIVERS`/`DRIVER`, `EMIS`/`EMI`, `VEHICLE_DETAILS`/`FLEET`, `STATUS`, `MAINTENANCE`).

## 4. Query Efficiency
* Avoid redundant schema checks (`SHOW COLUMNS`) on every HTTP request.
* Avoid making multiple sequential vehicle lookups when identifiers can be resolved in a single step.
