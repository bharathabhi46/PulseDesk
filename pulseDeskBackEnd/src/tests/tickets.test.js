import request from "supertest";
import { createApp } from "../app.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Message from "../models/Message.js";

const mockIo = {
  emit: () => {},
  to: () => ({ emit: () => {} })
};

const app = createApp(mockIo);

describe("Tickets & Messages API", () => {
  let customerUser1;
  let customerUser2;
  let agentUser;
  let adminUser;

  let customerToken1;
  let customerToken2;
  let agentToken;
  let adminToken;

  beforeEach(async () => {
    // Seed users
    customerUser1 = await User.create({
      name: "Customer 1",
      email: "cust1@test.com",
      password: "Password123!",
      role: "customer"
    });
    customerUser2 = await User.create({
      name: "Customer 2",
      email: "cust2@test.com",
      password: "Password123!",
      role: "customer"
    });
    agentUser = await User.create({
      name: "Agent 1",
      email: "agent1@test.com",
      password: "Password123!",
      role: "agent"
    });
    adminUser = await User.create({
      name: "Admin 1",
      email: "admin1@test.com",
      password: "Password123!",
      role: "admin"
    });

    // Obtain JWT tokens
    const loginCust1 = await request(app).post("/api/auth/login").send({ email: "cust1@test.com", password: "Password123!" });
    customerToken1 = loginCust1.body.token;

    const loginCust2 = await request(app).post("/api/auth/login").send({ email: "cust2@test.com", password: "Password123!" });
    customerToken2 = loginCust2.body.token;

    const loginAgent = await request(app).post("/api/auth/login").send({ email: "agent1@test.com", password: "Password123!" });
    agentToken = loginAgent.body.token;

    const loginAdmin = await request(app).post("/api/auth/login").send({ email: "admin1@test.com", password: "Password123!" });
    adminToken = loginAdmin.body.token;
  });

  describe("POST /api/tickets", () => {
    it("should allow customer to create a ticket and trigger local fallback triage", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${customerToken1}`)
        .send({
          title: "Outage: database is completely down",
          description: "We are getting 500 errors and cannot login at all. This is terrible and we are furious.",
          category: "Technical"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.title).toBe("Outage: database is completely down");
      expect(res.body.ticket.customer._id).toBe(String(customerUser1._id));
      
      // Verify local rule-based triage fallback:
      // "outage" should trigger "urgent" priority
      expect(res.body.ticket.priority).toBe("urgent");
      expect(res.body.ticket.ai.detectedPriority).toBe("urgent");
      expect(res.body.ticket.ai.sentiment.label).toBe("angry");

      // Verify a default intro message was automatically posted to the ticket
      const messages = await Message.find({ ticket: res.body.ticket._id });
      expect(messages.length).toBe(1);
      expect(messages[0].body).toContain("We are getting 500 errors");
    });
  });

  describe("GET /api/tickets & GET /api/tickets/:id", () => {
    let ticket1;
    let ticket2;

    beforeEach(async () => {
      // Create ticket for customer 1
      ticket1 = await Ticket.create({
        title: "Customer 1 Issue",
        description: "Need help with billing.",
        customer: customerUser1._id,
        priority: "medium",
        category: "Billing"
      });

      // Create ticket for customer 2
      ticket2 = await Ticket.create({
        title: "Customer 2 Issue",
        description: "Broken link on homepage.",
        customer: customerUser2._id,
        priority: "low",
        category: "General"
      });
    });

    it("should restrict customer to only their own tickets", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${customerToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tickets.length).toBe(1);
      expect(res.body.tickets[0]._id).toBe(String(ticket1._id));
    });

    it("should allow agents to see all unassigned tickets or their assigned tickets", async () => {
      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      // Both ticket1 and ticket2 are currently unassigned (assignedTo: null)
      expect(res.body.tickets.length).toBe(2);
    });

    it("should allow customers to view their own ticket details, but reject viewing other customers' tickets", async () => {
      const successRes = await request(app)
        .get(`/api/tickets/${ticket1._id}`)
        .set("Authorization", `Bearer ${customerToken1}`);
      expect(successRes.statusCode).toBe(200);
      expect(successRes.body.ticket.title).toBe("Customer 1 Issue");

      const failRes = await request(app)
        .get(`/api/tickets/${ticket1._id}`)
        .set("Authorization", `Bearer ${customerToken2}`);
      expect(failRes.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/tickets/:id/assign & PATCH /api/tickets/:id", () => {
    let ticket;

    beforeEach(async () => {
      ticket = await Ticket.create({
        title: "Unassigned Ticket",
        description: "Need help.",
        customer: customerUser1._id
      });
    });

    it("should allow staff to assign ticket to an agent", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket._id}/assign`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ agentId: agentUser._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.ticket.assignedTo._id).toBe(String(agentUser._id));
      expect(res.body.ticket.status).toBe("in_progress");
    });

    it("should block customers from assigning tickets", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket._id}/assign`)
        .set("Authorization", `Bearer ${customerToken1}`)
        .send({ agentId: agentUser._id });

      expect(res.statusCode).toBe(403);
    });

    it("should allow agents to update ticket status/priority", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ status: "resolved", priority: "high" });

      expect(res.statusCode).toBe(200);
      expect(res.body.ticket.status).toBe("resolved");
      expect(res.body.ticket.priority).toBe("high");
      expect(res.body.ticket.resolvedAt).toBeDefined();
    });

    it("should allow staff to unassign a ticket", async () => {
      await request(app)
        .patch(`/api/tickets/${ticket._id}/assign`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ agentId: agentUser._id });

      const res = await request(app)
        .patch(`/api/tickets/${ticket._id}/assign`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ agentId: null });

      expect(res.statusCode).toBe(200);
      expect(res.body.ticket.assignedTo).toBeNull();
    });

    it("should not allow direct update of assignedTo via update ticket endpoint", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ assignedTo: agentUser._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.ticket.assignedTo).toBeUndefined();
    });
  });

  describe("POST /api/tickets/:ticketId/messages", () => {
    let ticket;

    beforeEach(async () => {
      ticket = await Ticket.create({
        title: "Ticket for Conversation",
        description: "Chat history test",
        customer: customerUser1._id
      });
    });

    it("should allow customer and staff to add messages to the ticket", async () => {
      // Customer reply
      const reply1 = await request(app)
        .post(`/api/tickets/${ticket._id}/messages`)
        .set("Authorization", `Bearer ${customerToken1}`)
        .send({ body: "This is a reply from the customer" });

      expect(reply1.statusCode).toBe(201);
      expect(reply1.body.message.body).toBe("This is a reply from the customer");
      expect(reply1.body.message.sender._id).toBe(String(customerUser1._id));

      // Agent reply
      const reply2 = await request(app)
        .post(`/api/tickets/${ticket._id}/messages`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({ body: "This is a response from support" });

      expect(reply2.statusCode).toBe(201);
      expect(reply2.body.message.body).toBe("This is a response from support");
      expect(reply2.body.message.sender._id).toBe(String(agentUser._id));

      // Verify total message count in ticket detail
      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${customerToken1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.messages.length).toBe(2);
    });
  });

  describe("GET /api/tickets/analytics", () => {
    beforeEach(async () => {
      await Ticket.create([
        { title: "T1", description: "D1", customer: customerUser1._id, status: "open", priority: "high" },
        { title: "T2", description: "D2", customer: customerUser1._id, status: "in_progress", priority: "medium" },
        { title: "T3", description: "D3", customer: customerUser1._id, status: "resolved", priority: "low" }
      ]);
    });

    it("should allow admin to retrieve dashboard analytics", async () => {
      const res = await request(app)
        .get("/api/tickets/analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analytics.totals).toBeDefined();
    });

    it("should prevent customers from fetching analytics", async () => {
      const res = await request(app)
        .get("/api/tickets/analytics")
        .set("Authorization", `Bearer ${customerToken1}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
