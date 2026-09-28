import executeQuery from "@/helpers/dbConnection";
import { logFleetActivity } from "@/backend/models/fleetActivityModel";

export default async function handler(req, res) {
  try {
    // 1. Find any drivers that are assigned to a fleet
    const drivers = await executeQuery(`
      SELECT d.id AS driver_id, d.driver_name, d.fleet_id, f.vehicle_number 
      FROM drivers d 
      JOIN fleets f ON d.fleet_id = f.id
      WHERE d.fleet_id IS NOT NULL
    `);

    let logged = 0;
    if (Array.isArray(drivers)) {
      for (const d of drivers) {
        // Check if assignment record already exists
        const existing = await executeQuery(
          `SELECT id FROM fleet_activity_history WHERE fleet_id = ? AND operation_type = 'DRIVER' AND entity_id = ? LIMIT 1`,
          [d.fleet_id, String(d.driver_id)]
        );

        if (!existing || existing.length === 0) {
          await logFleetActivity({
            fleetId: d.fleet_id,
            operationType: "DRIVER",
            entityType: "DRIVER_ALLOCATION",
            entityId: String(d.driver_id),
            action: "ASSIGN",
            title: "Driver assigned",
            description: `Driver: ${d.driver_name}`,
            oldValue: null,
            newValue: { driver_id: d.driver_id, driver_name: d.driver_name },
            changedFields: ["driver_id", "driver_name"],
            performedByName: "Admin User",
            source: "driver",
            metadata: { vehicle_number: d.vehicle_number, driver_name: d.driver_name },
          });
          logged++;
        }
      }
    }

    return res.status(200).json({ status: true, message: `Synced ${logged} driver assignment records`, count: logged });
  } catch (err) {
    return res.status(500).json({ status: false, error: err?.message });
  }
}
