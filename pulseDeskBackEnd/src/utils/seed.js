import { connectDB } from "../config/db.js";
import User from "../models/User.js";

await connectDB();

const users = [
  {
    name: "Super Admin User",
    email: "superadmin@pulsedesk.dev",
    password: "SuperAdmin123!",
    role: "superadmin",
    department: "Executive"
  },
  {
    name: "Admin User",
    email: "admin@pulsedesk.dev",
    password: "Admin123!",
    role: "admin",
    department: "Operations"
  },
  {
    name: "Support Manager",
    email: "manager@pulsedesk.dev",
    password: "Manager123!",
    role: "manager",
    department: "Customer Success"
  },
  {
    name: "Support Agent",
    email: "agent@pulsedesk.dev",
    password: "Agent123!",
    role: "agent",
    department: "Support Support"
  },
  {
    name: "Customer User",
    email: "customer@pulsedesk.dev",
    password: "Customer123!",
    role: "customer",
    department: "Client Services"
  }
];

for (const user of users) {
  const existing = await User.findOne({ email: user.email });
  if (existing) {
    existing.name = user.name;
    existing.role = user.role;
    existing.password = user.password;
    existing.department = user.department;
    await existing.save();
  } else {
    await User.create(user);
  }
}

console.log("Successfully seeded 5 core PulseDesk accounts.");
process.exit(0);
