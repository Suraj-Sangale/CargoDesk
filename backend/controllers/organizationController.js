import {
  getAllOrganizationsModel,
  createOrganizationModel,
  updateOrganizationModel,
  deleteOrganizationModel,
} from "../models/organizationModel";

export function getAllOrganizationsController() {
  return new Promise((resolve) => {
    getAllOrganizationsModel()
      .then((res) => resolve(res))
      .catch((err) => resolve({ status: false, error: err?.message, data: [] }));
  });
}

export function createOrganizationController(request) {
  return new Promise((resolve) => {
    createOrganizationModel(request)
      .then((res) => resolve(res))
      .catch((err) => resolve({ status: false, message: err?.message }));
  });
}

export function updateOrganizationController(request) {
  return new Promise((resolve) => {
    updateOrganizationModel(request)
      .then((res) => resolve(res))
      .catch((err) => resolve({ status: false, message: err?.message }));
  });
}

export function deleteOrganizationController(request) {
  return new Promise((resolve) => {
    deleteOrganizationModel(request?.orgId || request?.id)
      .then((res) => resolve(res))
      .catch((err) => resolve({ status: false, message: err?.message }));
  });
}
