import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";
import { uploadFiles } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createMessage = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const isCustomer = req.user.role === "customer";
  if (isCustomer && String(ticket.customer) !== String(req.user._id)) {
    throw new ApiError(403, "You cannot reply to this ticket");
  }

  const attachments = await uploadFiles(req.files);
  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user._id,
    body: req.body.body,
    attachments,
    isInternal: Boolean(req.body.isInternal) && req.user.role !== "customer",
    readBy: [req.user._id]
  });

  if (!ticket.firstResponseAt && req.user.role !== "customer") ticket.firstResponseAt = new Date();
  ticket.status = req.user.role === "customer" ? "open" : ticket.status;
  await ticket.save();

  const populated = await message.populate("sender", "name email role avatarUrl");
  req.io?.to(`ticket:${ticket._id}`).emit("message:created", populated);
  res.status(201).json({ success: true, message: populated });
});
