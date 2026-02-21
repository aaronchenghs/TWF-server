import http from "node:http";
import express from "express";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twf/contracts";
import { registerSocketHandlers } from "./socket/index.js";
import "dotenv/config";
import { runRoomJanitor, stopRoomJanitor } from "./lib/roomCleanup.js";
import { readNumberEnv, readStringListEnv } from "./lib/env.js";

const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const configuredOrigins = readStringListEnv("CLIENT_ORIGINS");
const CLIENT_ORIGINS =
  configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_CLIENT_ORIGINS;
const PORT = readNumberEnv("PORT", 3001);

const app = express();
app.get("/health", (_req, res) => res.status(200).send("ok"));

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketHandlers(io);
runRoomJanitor();

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`CLIENT_ORIGINS=${CLIENT_ORIGINS.join(",")}`);
});

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[${signal}] shutting down...`);
  stopRoomJanitor();

  const safetyExitForHang = setTimeout(() => {
    console.log("Force exit.");
    process.exit(1);
  }, 5_000).unref();

  io.close(() => {
    httpServer.close(() => {
      clearTimeout(safetyExitForHang);
      console.log("Socket.IO and HTTP server closed.");
      process.exit(0);
    });
  });
}

let isShuttingDown = false;
