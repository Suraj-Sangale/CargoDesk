import {
  getFleetActivityHistoryModel,
  logFleetActivity,
} from "@/backend/models/fleetActivityModel";

export function getFleetActivityHistoryController(req, res) {
  const { fleetId, vehicleNo, type, operationType, action, entityType, fromDate, toDate, search, page, limit } = req.query;

  getFleetActivityHistoryModel({
    fleetId: fleetId || req.query.id,
    vehicleNo,
    type,
    operationType,
    action,
    entityType,
    fromDate,
    toDate,
    search,
    page,
    limit,
  })
    .then((response) => {
      if (response.status) {
        return res.status(200).json(response);
      }
      return res.status(400).json(response);
    })
    .catch((error) => {
      console.error("Controller error fetching fleet activity history:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error while fetching fleet activity history",
        error: error?.message,
      });
    });
}

export function logFleetActivityController(req, res) {
  const body = req.body || {};

  logFleetActivity(body)
    .then((response) => {
      if (response.status) {
        return res.status(200).json(response);
      }
      return res.status(400).json(response);
    })
    .catch((error) => {
      console.error("Controller error logging fleet activity:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error while logging fleet activity",
        error: error?.message,
      });
    });
}
