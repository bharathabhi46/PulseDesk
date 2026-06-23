import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import fs from "fs/promises";
import path from "path";

let mongod;

// Set test environment configuration
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-value-longer-than-32-characters-123456789";
env.jwtSecret = "test-secret-value-longer-than-32-characters-123456789";

beforeAll(async () => {
  // Start the in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  process.env.MONGO_URI = uri;
  env.mongoUri = uri;

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
  }

  // Clean up any test upload files
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      await fs.unlink(path.join(uploadDir, file));
    }
  } catch (err) {
    // Ignore if directory doesn't exist
  }
});
