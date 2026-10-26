import {
  addNewUserModel,
  getUserDetailsByIdModel,
  verifyUserModel,
  getAllUsersModel,
  updateUserModel,
  deleteUserModel,
} from "../models/userModel";

export function getAllUsersController() {
  return new Promise((resolve, reject) => {
    getAllUsersModel()
      .then((result) => resolve(result))
      .catch((error) => {
        resolve({
          status: false,
          error: error?.message || "Failed to fetch users",
          data: [],
        });
      });
  });
}

export function addNeUserController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    addNewUserModel(request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        resolve({
          status: false,
          message: error?.message || "Cannot add user",
        });
      });
  });
}

export function updateUserController(request, authUser = null) {
  return new Promise((resolve, reject) => {
    updateUserModel(request, authUser)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        resolve({
          status: false,
          message: error?.message || "Cannot update user",
        });
      });
  });
}

export function deleteUserController(request) {
  return new Promise((resolve, reject) => {
    const userIds = request?.ids || (request?.userId ? [request.userId] : request?.id ? [request.id] : []);
    deleteUserModel(userIds)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        resolve({
          status: false,
          message: error?.message || "Cannot delete user",
        });
      });
  });
}

export function verifyUserController(request) {
  return new Promise((resolve, reject) => {
    const response = {
      status: false,
    };
    const user_id = request.user_id;
    const password = request.password;
    verifyUserModel(user_id, password)
      .then((result) => {
        if (result.status) {
          response.status = true;
          response.user = result.user;
          response.userId = result.userId;
          response.message = "User login successfully";
          resolve(response);
        } else {
          response.message = result.message;
          resolve(response);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getUserDetailsById(id) {
  return new Promise((resolve, reject) => {
    const response = {
      status: false,
    };
    if (!id) {
      response.message = "id is required";
      return resolve(response);
    }
    getUserDetailsByIdModel(id)
      .then((result) => {
        if (result) {
          response.status = true;
          response.data = result;
          resolve(response);
        } else {
          response.message = "details not found";
          resolve(response);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
