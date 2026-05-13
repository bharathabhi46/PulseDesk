import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);
    if (["admin", "agent"].includes(socket.user.role)) socket.join("staff");

    socket.on("ticket:join", async (ticketId) => {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return;
      const canJoin =
        socket.user.role !== "customer" || String(ticket.customer) === String(socket.user._id);
      if (canJoin) socket.join(`ticket:${ticketId}`);
    });

    socket.on("typing", ({ ticketId, isTyping }) => {
      socket.to(`ticket:${ticketId}`).emit("typing", {
        ticketId,
        user: { id: socket.user._id, name: socket.user.name, role: socket.user.role },
        isTyping
      });
    });

    socket.on("message:send", async ({ ticketId, body }) => {
      if (!body?.trim()) return;
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) return;
      const message = await Message.create({
        ticket: ticketId,
        sender: socket.user._id,
        body: body.trim(),
        readBy: [socket.user._id]
      });
      const populated = await message.populate("sender", "name email role avatarUrl");
      io.to(`ticket:${ticketId}`).emit("message:created", populated);
    });
  });
};
