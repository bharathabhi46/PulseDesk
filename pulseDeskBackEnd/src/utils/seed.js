import { connectDB } from "../config/db.js";
import User from "../models/User.js";

await connectDB();

const users = [
  { name: "Admin User", email: "admin@pulsedesk.dev", password: "Password123", role: "admin" },
  { name: "Support Agent", email: "agent@pulsedesk.dev", password: "Password123", role: "agent" },
  { name: "Customer User", email: "customer@pulsedesk.dev", password: "Password123", role: "customer" }
];

for (const user of users) {
  const existing = await User.findOne({ email: user.email });
  if (existing) {
    existing.name = user.name;
    existing.role = user.role;
    existing.password = user.password;
    await existing.save();
  } else {
    await User.create(user);
  }
}

console.log("Seeded PulseDesk demo users");
process.exit(0);
