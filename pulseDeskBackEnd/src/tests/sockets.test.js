import http from "http";
import { Server } from "socket.io";
import { io as Client } from "socket.io-client";
import { registerSocketHandlers } from "../sockets/socketHandler.js";
import { signToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

describe("Socket.IO Real-time Communication", () => {
  let server;
  let io;
  let port;
  let customerUser;
  let agentUser;
  let customerToken;
  let agentToken;
  let ticket;

  beforeAll(async () => {
    server = http.createServer();
    io = new Server(server);
    registerSocketHandlers(io);
    
    await new Promise((resolve) => {
      server.listen(() => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    io.close();
    await new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Seed users
    customerUser = await User.create({
      name: "Socket Customer",
      email: "sockcust@test.com",
      password: "Password123!",
      role: "customer"
    });

    agentUser = await User.create({
      name: "Socket Agent",
      email: "sockagent@test.com",
      password: "Password123!",
      role: "agent"
    });

    // Create a ticket
    ticket = await Ticket.create({
      title: "Socket Ticket",
      description: "Testing real-time updates",
      customer: customerUser._id
    });

    customerToken = signToken(customerUser);
    agentToken = signToken(agentUser);
  });

  it("should block unauthenticated socket connections", async () => {
    const socket = Client(`http://localhost:${port}`, {
      autoConnect: false
    });
    socket.connect();

    await new Promise((resolve, reject) => {
      socket.on("connect_error", (err) => {
        try {
          expect(err.message).toBe("Unauthorized");
          socket.disconnect();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      // Timeout fallback to prevent hanging
      setTimeout(() => reject(new Error("Timeout waiting for connect_error")), 2000);
    });
  });

  it("should allow authenticated customer to connect and join room", async () => {
    const socket = Client(`http://localhost:${port}`, {
      auth: { token: customerToken }
    });

    await new Promise((resolve, reject) => {
      socket.on("connect", () => {
        try {
          expect(socket.connected).toBe(true);
          socket.emit("ticket:join", String(ticket._id));
          socket.disconnect();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
      setTimeout(() => reject(new Error("Timeout waiting for connect")), 2000);
    });
  });

  it("should broadcast typing events to other room members", async () => {
    const customerSocket = Client(`http://localhost:${port}`, {
      auth: { token: customerToken }
    });

    const agentSocket = Client(`http://localhost:${port}`, {
      auth: { token: agentToken }
    });

    await new Promise((resolve, reject) => {
      agentSocket.on("connect", () => {
        agentSocket.emit("ticket:join", String(ticket._id));

        // Wait a moment for agent to join room, then customer types
        setTimeout(() => {
          customerSocket.emit("typing", { ticketId: String(ticket._id), isTyping: true });
        }, 100);
      });

      agentSocket.on("typing", (data) => {
        try {
          expect(data.ticketId).toBe(String(ticket._id));
          expect(data.isTyping).toBe(true);
          expect(data.user.name).toBe(customerUser.name);
          
          agentSocket.disconnect();
          customerSocket.disconnect();
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      customerSocket.connect();
      agentSocket.connect();

      setTimeout(() => reject(new Error("Timeout waiting for typing event")), 4000);
    });
  });
});
