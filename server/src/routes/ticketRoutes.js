import express from "express";
import {
  assignTicket,
  createTicket,
  getAnalytics,
  getTicket,
  listTickets,
  updateTicket
} from "../controllers/ticketController.js";
import { createMessage } from "../controllers/messageController.js";
import { authorize, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);
router.get("/analytics", authorize("admin", "agent"), getAnalytics);
router.route("/").get(listTickets).post(upload.array("attachments", 5), createTicket);
router.route("/:id").get(getTicket).patch(authorize("admin", "agent"), updateTicket);
router.patch("/:id/assign", authorize("admin", "agent"), assignTicket);
router.post("/:ticketId/messages", upload.array("attachments", 5), createMessage);

export default router;
