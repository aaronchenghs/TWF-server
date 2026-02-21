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
import { readBooleanEnv, readNumberEnv, readStringListEnv } from "./lib/env.js";
import { isPrivateNetworkOrigin } from "./lib/network.js";

const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const configuredOrigins = readStringListEnv("CLIENT_ORIGINS");
const CLIENT_ORIGINS =
  configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_CLIENT_ORIGINS;
const ALLOW_PRIVATE_NETWORK_ORIGINS = readBooleanEnv(
  "ALLOW_PRIVATE_NETWORK_ORIGINS",
  true,
);
const PORT = readNumberEnv("PORT", 3001);
const allowedOrigins = new Set(CLIENT_ORIGINS);

const app = express();
app.get("/health", (_req, res) => res.status(200).send("ok"));

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Some clients/proxies omit Origin on same-origin or non-browser requests.
      if (!origin || origin === "null") {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (ALLOW_PRIVATE_NETWORK_ORIGINS && isPrivateNetworkOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

registerSocketHandlers(io);
runRoomJanitor();

// Helps with newer browser Private Network Access preflight flows.
io.engine.on("initial_headers", (headers) => {
  headers["Access-Control-Allow-Private-Network"] = "true";
});
io.engine.on("headers", (headers) => {
  headers["Access-Control-Allow-Private-Network"] = "true";
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`CLIENT_ORIGINS=${CLIENT_ORIGINS.join(",")}`);
  console.log(
    `ALLOW_PRIVATE_NETWORK_ORIGINS=${String(ALLOW_PRIVATE_NETWORK_ORIGINS)}`,
  );
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
