import http from "node:http";
import express from "express";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twf/contracts";
import { registerSocketHandlers } from "./socket";
import "dotenv/config";
import { runRoomJanitor, stopRoomJanitor } from "./lib/roomCleanup";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const PORT = Number(process.env.PORT ?? 3001);

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

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`CLIENT_ORIGIN=${CLIENT_ORIGIN}`);
});

function shutdown(signal: string) {
  console.log(`[${signal}] shutting down...`);
  stopRoomJanitor();

  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  // safety exit if something hangs
  setTimeout(() => {
    console.log("Force exit.");
    process.exit(1);
  }, 5_000).unref();
}
