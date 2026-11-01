import {
  getFleetActivityHistoryController,
  logFleetActivityController,
} from "@/backend/controllers/fleetActivityController";

export default function handler(req, res) {
  if (req.method === "GET") {
    return getFleetActivityHistoryController(req, res);
  } else if (req.method === "POST") {
    const body = req.body || {};
    // If payload contains explicit logging attributes, delegate to logger
    if (body.action && body.entityType && (body.title || body.description || body.changedFields || body.oldValue || body.newValue)) {
      return logFleetActivityController(req, res);
    }
    // Otherwise standard postApiData fetch request
    return getFleetActivityHistoryController(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} not allowed`,
    });
  }
}
