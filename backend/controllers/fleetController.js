import {
  addNewFleetModel,
  deleteFleetModel,
  getAllFleetsModel,
  updateFleetModel,
} from "../models/fleetModel";

export function getAllFleetsController() {
  return new Promise((resolve, reject) => {
    getAllFleetsModel()
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function addNewFleetController(request) {
  return new Promise((resolve, reject) => {
    addNewFleetModel(request)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function updateFleetController(request) {
  return new Promise((resolve, reject) => {
    const id = request.id;
    updateFleetModel(id, request)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function deleteFleetController(ids) {
  return new Promise((resolve, reject) => {
    deleteFleetModel(ids)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
