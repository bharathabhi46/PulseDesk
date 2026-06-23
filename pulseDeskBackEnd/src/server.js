import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";

const bootstrap = async () => {
  await connectDB();

  const io = new Server({
    cors: { origin: env.clientUrl, credentials: true }
  });

  const app = createApp(io);
  const httpServer = http.createServer(app);
  io.attach(httpServer);
  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    console.log(`PulseDesk API listening on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start PulseDesk API", error);
  process.exit(1);
});
