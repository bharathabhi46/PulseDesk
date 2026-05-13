import express from "express";
import { listNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", listNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;
