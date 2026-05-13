import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";

const bootstrap = async () => {
  await connectDB();

  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true }
  });

  const app = createApp(io);
  httpServer.removeAllListeners("request");
  httpServer.on("request", app);
  registerSocketHandlers(io);

  httpServer.listen(env.port, () => {
    console.log(`PulseDesk API listening on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start PulseDesk API", error);
  process.exit(1);
});
