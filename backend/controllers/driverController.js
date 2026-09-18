import {
  addNewDriverModel,
  deleteDriverModel,
  getAllDriversModel,
  updateDriverModel,
} from "../models/driverModel";

export function getAllDriversController() {
  return new Promise((resolve, reject) => {
    getAllDriversModel()
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function addNewDriverController(request) {
  return new Promise((resolve, reject) => {
    addNewDriverModel(request)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function updateDriverController(request) {
  return new Promise((resolve, reject) => {
    const id = request.id;
    updateDriverModel(id, request)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function deleteDriverController(ids) {
  return new Promise((resolve, reject) => {
    deleteDriverModel(ids)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
