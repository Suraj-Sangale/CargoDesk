import { getAllOrganizationsController } from "@/backend/controllers/organizationController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    getAllOrganizationsController()
      .then((result) => {
        res.status(200).json(result);
        resolve();
      })
      .catch((error) => {
        res.status(200).json({ status: false, error: error?.message, data: [] });
        resolve();
      });
  });
}
