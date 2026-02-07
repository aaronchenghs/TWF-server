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
import { readNumberEnv, readStringEnv } from "./lib/env.js";

const CLIENT_ORIGIN = readStringEnv("CLIENT_ORIGIN", "http://localhost:5173");
const PORT = readNumberEnv("PORT", 3001);

const app = express();
app.get("/health", (_req, res) => res.status(200).send("ok"));

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
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
  console.log(`CLIENT_ORIGIN=${CLIENT_ORIGIN}`);
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
