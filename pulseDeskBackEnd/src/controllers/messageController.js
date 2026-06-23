import { env } from "../config/env.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { sendMail } from "../services/mailService.js";
import { uploadFiles } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const executeMessageCreation = async ({ ticketId, sender, body, attachments = [], isInternal = false, io }) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const isCustomer = sender.role === "customer";
  if (isCustomer && String(ticket.customer) !== String(sender._id)) {
    throw new ApiError(403, "You cannot reply to this ticket");
  }

  const message = await Message.create({
    ticket: ticket._id,
    sender: sender._id,
    body: body || "",
    attachments,
    isInternal: isInternal && !isCustomer,
    readBy: [sender._id]
  });

  // Calculate response stats and reset status
  if (!ticket.firstResponseAt && !isCustomer) {
    ticket.firstResponseAt = new Date();
  }
  ticket.status = isCustomer ? "open" : ticket.status;
  await ticket.save();

  const populated = await message.populate("sender", "name email role avatarUrl");

  // Broadcast new message in real-time
  io?.to(`ticket:${ticket._id}`).emit("message:created", populated);

  // Manage notifications & emails
  const notificationsToCreate = [];
  const cleanBody = body || (attachments.length ? `[Sent ${attachments.length} attachment(s)]` : "");

  if (isCustomer) {
    if (ticket.assignedTo) {
      notificationsToCreate.push({
        user: ticket.assignedTo,
        title: "New reply on assigned ticket",
        body: `${sender.name}: ${cleanBody.slice(0, 80)}`,
        type: "message",
        link: `/tickets/${ticket._id}`
      });

      const agent = await User.findById(ticket.assignedTo);
      if (agent) {
        await sendMail({
          to: agent.email,
          subject: `PulseDesk: Reply on ticket "${ticket.title}"`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #16211f; background-color: #f7f8f3;">
              <h3>New reply from customer ${sender.name}</h3>
              <p>Ticket: <strong>${ticket.title}</strong></p>
              <blockquote style="border-left: 4px solid #66c3a6; padding-left: 10px; margin-left: 0; color: #555;">
                ${cleanBody}
              </blockquote>
              <a href="${env.clientUrl}/tickets/${ticket._id}" style="display: inline-block; padding: 10px 18px; background-color: #16211f; color: white; text-decoration: none; font-weight: bold; margin-top: 15px;">View Ticket</a>
            </div>
          `
        }).catch(err => console.error("[Mail Error]", err));
      }
    } else {
      // Notify all staff
      const staff = await User.find({ role: { $in: ["superadmin", "admin", "manager", "agent"] } });
      staff.forEach((member) => {
        notificationsToCreate.push({
          user: member._id,
          title: "New customer reply",
          body: `${sender.name}: ${cleanBody.slice(0, 80)}`,
          type: "message",
          link: `/tickets/${ticket._id}`
        });
      });
    }
  } else if (!isInternal) {
    // Notify customer
    notificationsToCreate.push({
      user: ticket.customer,
      title: "New reply on your ticket",
      body: `${sender.name}: ${cleanBody.slice(0, 80)}`,
      type: "message",
      link: `/tickets/${ticket._id}`
    });

    const customer = await User.findById(ticket.customer);
    if (customer) {
      await sendMail({
        to: customer.email,
        subject: `PulseDesk Update: New reply on "${ticket.title}"`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #16211f; background-color: #f7f8f3;">
            <h3>Our support team has replied to your ticket</h3>
            <p>Ticket: <strong>${ticket.title}</strong></p>
            <blockquote style="border-left: 4px solid #66c3a6; padding-left: 10px; margin-left: 0; color: #555;">
              ${cleanBody}
            </blockquote>
            <a href="${env.clientUrl}/tickets/${ticket._id}" style="display: inline-block; padding: 10px 18px; background-color: #16211f; color: white; text-decoration: none; font-weight: bold; margin-top: 15px;">View Response</a>
          </div>
        `
      }).catch(err => console.error("[Mail Error]", err));
    }
  }

  if (notificationsToCreate.length) {
    const createdNotifs = await Notification.insertMany(notificationsToCreate);
    createdNotifs.forEach((notif) => {
      io?.to(`user:${notif.user}`).emit("notification:created", notif);
    });
  }

  // Broadcast updated ticket so details/lists update
  const populatedTicket = await ticket.populate([
    { path: "customer", select: "name email role avatarUrl" },
    { path: "assignedTo", select: "name email role avatarUrl department" }
  ]);
  io?.to("staff").emit("ticket:updated", populatedTicket);
  io?.to(`user:${ticket.customer}`).emit("ticket:updated", populatedTicket);

  return populated;
};

export const createMessage = asyncHandler(async (req, res) => {
  const attachments = await uploadFiles(req.files);
  const body = req.body.body;
  const isInternal = Boolean(req.body.isInternal);

  if (!body?.trim() && !attachments.length) {
    throw new ApiError(400, "Message body or attachments are required");
  }

  const message = await executeMessageCreation({
    ticketId: req.params.ticketId,
    sender: req.user,
    body: body || "",
    attachments,
    isInternal,
    io: req.io
  });

  res.status(201).json({ success: true, message });
});
