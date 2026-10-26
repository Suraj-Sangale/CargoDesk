import { deleteUserController } from "@/backend/controllers/userController";

export default function handler(req, res) {
  return new Promise((resolve) => {
    const request = req.body;
    deleteUserController(request)
      .then((result) => {
        res.status(200).json(result);
        resolve();
      })
      .catch((error) => {
        res.status(200).json({
          status: false,
          error: error?.message || "Failed to delete sub-user",
        });
        resolve();
      });
  });
}
