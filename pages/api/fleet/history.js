import {
  getFleetActivityHistoryController,
  logFleetActivityController,
} from "@/backend/controllers/fleetActivityController";

export default function handler(req, res) {
  if (req.method === "GET") {
    return getFleetActivityHistoryController(req, res);
  } else if (req.method === "POST") {
    return logFleetActivityController(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      status: false,
      message: `Method ${req.method} not allowed`,
    });
  }
}
