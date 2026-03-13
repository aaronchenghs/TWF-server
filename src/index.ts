/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import "dotenv/config";
import http from "node:http";
import express from "express";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@twf/contracts";
import { registerSocketHandlers } from "./socket/index.js";
import { emitRoomState } from "./socket/emit.js";
import { runRoomJanitor, stopRoomJanitor } from "./lib/roomCleanup.js";
import { readBooleanEnv, readNumberEnv, readStringListEnv } from "./lib/env.js";
import { isPrivateNetworkOrigin } from "./lib/network.js";
import { getTierSet } from "./tierSets/registry.js";
import { restoreRooms } from "./lib/rooms.js";
import {
  initializeRoomStore,
  loadHydratedRooms,
  shutdownRoomStore,
} from "./lib/roomStore.js";
import { reschedule } from "./lib/timing.js";

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

// Helps with newer browser Private Network Access preflight flows.
io.engine.on("initial_headers", (headers) => {
  headers["Access-Control-Allow-Private-Network"] = "true";
});
io.engine.on("headers", (headers) => {
  headers["Access-Control-Allow-Private-Network"] = "true";
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

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
      void shutdownRoomStore()
        .catch((error) => {
          console.error("Failed to close Redis client.", error);
        })
        .finally(() => {
          clearTimeout(safetyExitForHang);
          console.log("Socket.IO and HTTP server closed.");
          process.exit(0);
        });
    });
  });
}

let isShuttingDown = false;

void bootstrap();

async function bootstrap() {
  try {
    await initializeRoomStore();

    const restored = await loadHydratedRooms();
    restoreRooms(restored);
    registerSocketHandlers(io);
    runRoomJanitor();

    for (const room of restored) {
      reschedule(room, (nextRoom) => emitRoomState(io, nextRoom), getTierSet);
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on :${PORT}`);
      console.log(`CLIENT_ORIGINS=${CLIENT_ORIGINS.join(",")}`);
      console.log(
        `ALLOW_PRIVATE_NETWORK_ORIGINS=${String(ALLOW_PRIVATE_NETWORK_ORIGINS)}`,
      );
      console.log(`RESTORED_ROOMS=${restored.length}`);
    });
  } catch (error) {
    console.error("Startup failed.", error);
    process.exit(1);
  }
}
