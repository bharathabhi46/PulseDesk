import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import { analyzeTicket } from "../services/aiService.js";
import { sendMail } from "../services/mailService.js";
import { uploadFiles } from "../services/uploadService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ticketPopulate = [
  { path: "customer", select: "name email role avatarUrl" },
  { path: "assignedTo", select: "name email role avatarUrl department" }
];

export const createTicket = asyncHandler(async (req, res) => {
  const attachments = await uploadFiles(req.files);
  const ai = await analyzeTicket(req.body);
  const priority = req.body.priority || ai.detectedPriority || "medium";

  const ticket = await Ticket.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category || "General",
    customer: req.user._id,
    priority,
    tags: req.body.tags ? String(req.body.tags).split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    attachments,
    ai
  });

  await Message.create({
    ticket: ticket._id,
    sender: req.user._id,
    body: req.body.description,
    attachments
  });

  const staff = await User.find({ role: { $in: ["superadmin", "admin", "manager", "agent"] } });
  await Notification.insertMany(
    staff.map((user) => ({
      user: user._id,
      title: "New support ticket",
      body: ticket.title,
      type: "ticket",
      link: `/tickets/${ticket._id}`
    }))
  );

  req.io?.to("staff").emit("ticket:created", ticket);
  res.status(201).json({ success: true, ticket: await ticket.populate(ticketPopulate) });
});

export const listTickets = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === "customer") query.customer = req.user._id;
  if (req.user.role === "agent") query.$or = [{ assignedTo: req.user._id }, { assignedTo: null }];
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;

  const tickets = await Ticket.find(query).populate(ticketPopulate).sort({ updatedAt: -1 });
  res.json({ success: true, tickets });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(ticketPopulate);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const canView =
    ["superadmin", "admin", "manager"].includes(req.user.role) ||
    String(ticket.customer._id) === String(req.user._id) ||
    String(ticket.assignedTo?._id) === String(req.user._id) ||
    (req.user.role === "agent" && !ticket.assignedTo);

  if (!canView) throw new ApiError(403, "You cannot view this ticket");

  const messages = await Message.find({ ticket: ticket._id })
    .populate("sender", "name email role avatarUrl")
    .sort({ createdAt: 1 });

  res.json({ success: true, ticket, messages });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const allowed = ["status", "priority", "category", "tags"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) ticket[field] = req.body[field];
  });

  if (req.body.status === "resolved" && !ticket.resolvedAt) ticket.resolvedAt = new Date();
  await ticket.save();

  const populated = await ticket.populate(ticketPopulate);
  req.io?.to(`ticket:${ticket._id}`).emit("ticket:updated", populated);
  req.io?.to("staff").emit("ticket:updated", populated);

  if (ticket.assignedTo) {
    await Notification.create({
      user: ticket.assignedTo,
      title: "Ticket updated",
      body: ticket.title,
      type: "ticket",
      link: `/tickets/${ticket._id}`
    });
  }

  res.json({ success: true, ticket: populated });
});

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  if (!req.body.agentId) {
    ticket.assignedTo = null;
    await ticket.save();
    const populated = await ticket.populate(ticketPopulate);
    req.io?.to(`ticket:${ticket._id}`).emit("ticket:updated", populated);
    req.io?.to("staff").emit("ticket:updated", populated);
    return res.json({ success: true, ticket: populated });
  }

  const agent = await User.findOne({ _id: req.body.agentId, role: { $in: ["superadmin", "admin", "manager", "agent"] } });
  if (!agent) throw new ApiError(400, "Assigned user must be a staff member");

  ticket.assignedTo = agent._id;
  ticket.status = ticket.status === "open" ? "in_progress" : ticket.status;
  await ticket.save();

  await Notification.create({
    user: agent._id,
    title: "Ticket assigned to you",
    body: ticket.title,
    type: "assignment",
    link: `/tickets/${ticket._id}`
  });

  await sendMail({
    to: agent.email,
    subject: `PulseDesk assignment: ${ticket.title}`,
    html: `<p>You have been assigned ticket <strong>${ticket.title}</strong>.</p>`
  });

  const populated = await ticket.populate(ticketPopulate);
  req.io?.to(`ticket:${ticket._id}`).emit("ticket:updated", populated);
  req.io?.to("staff").emit("ticket:updated", populated);
  res.json({ success: true, ticket: populated });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const [statusMetrics, priorityMetrics, sentimentMetrics, totals] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $group: { _id: "$ai.sentiment.label", count: { $sum: 1 } } }]),
    Ticket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          avgResponseMs: {
            $avg: {
              $cond: [
                { $and: ["$firstResponseAt", "$createdAt"] },
                { $subtract: ["$firstResponseAt", "$createdAt"] },
                null
              ]
            }
          }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    analytics: {
      totals: totals[0] || { total: 0, open: 0, resolved: 0, avgResponseMs: 0 },
      byStatus: statusMetrics,
      byPriority: priorityMetrics,
      bySentiment: sentimentMetrics
    }
  });
});
