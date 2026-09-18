import {
  assignDriverToFleetModel,
  removeDriverFromFleetModel,
} from "../models/fleetDriverModel";

export function assignDriverToFleetController(request) {
  return new Promise((resolve, reject) => {
    const fleetId = request?.fleetId || request?.fleet_id;
    const driverId = request?.driverId || request?.driver_id;
    assignDriverToFleetModel(fleetId, driverId)
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}

export function removeDriverFromFleetController(request) {
  return new Promise((resolve, reject) => {
    const driverId = request?.driverId || request?.driver_id;
    const fleetId = request?.fleetId || request?.fleet_id;
    removeDriverFromFleetModel({ driverId, fleetId })
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}
