# Tiers! With Friends - Server

Socket.IO + Express backend for the Tiers With Friends app. Client-side Repo Here: https://github.com/aaronchenghs/TWF-client

This service manages:

- Room create/join/close flow
- Tier set listing and selection
- Turn-based placement and voting
- Auto-advancing game phases using timers
- In-memory room cleanup and expiry

## Table of Contents

- [Tiers! With Friends - Server](#tiers-with-friends---server)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
  - [Requirements](#requirements)
  - [Configuration](#configuration)
  - [Scripts](#scripts)
  - [Run Modes](#run-modes)
  - [Health Check](#health-check)
  - [Socket API](#socket-api)
    - [Client -\> Server events](#client---server-events)
    - [Server -\> Client events](#server---client-events)
  - [Runtime Constraints](#runtime-constraints)
    - [Minimal client connection example](#minimal-client-connection-example)
  - [Game Lifecycle](#game-lifecycle)
  - [Room Lifetime and Cleanup](#room-lifetime-and-cleanup)
  - [Project Structure](#project-structure)
  - [Deployment Notes](#deployment-notes)
  - [Troubleshooting](#troubleshooting)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

3. Start development server:

```bash
npm run dev
```

Server URL: `http://localhost:<PORT>`

## Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- Git installed (required because `@twf/contracts` is installed from a GitHub commit)

## Configuration

Create `.env` in the repo root.

The source of truth for env defaults is `.env.example`.

| Variable                | Description                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `PORT`                  | HTTP + Socket.IO port. Server binds to `0.0.0.0`.                                                  |
| `CLIENT_ORIGINS`        | Comma-separated allowed CORS origins for client requests/websocket handshake.                      |
| `ENABLE_DEBUG_CONTROLS` | Enables `debug:*` socket events for host-only debug controls. Must be the string `true` to enable. |
| `ROOM_TTL_MS`           | Max inactive room age before janitor removes a room.                                               |
| `CLEANUP_INTERVAL_MS`   | Janitor sweep interval.                                                                            |

Notes:

- Numeric env values fall back to defaults if missing/invalid.
- Empty string env values also fall back to defaults.
- `CLIENT_ORIGINS` defaults to `http://localhost:5173,http://127.0.0.1:5173`.

## Scripts

| Command         | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Run with `tsx watch` (hot reload on file changes). |
| `npm run build` | Compile TypeScript to `dist/`.                     |
| `npm start`     | Run compiled server from `dist/index.js`.          |

## Run Modes

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

On startup, server logs:

- `Server listening on :<PORT>`
- `CLIENT_ORIGINS=<value>`

## Health Check

- Endpoint: `GET /health`
- Success response: `200 ok`

Example:

```bash
curl http://localhost:<PORT>/health
```

## Socket API

Authoritative event and payload types come from `@twf/contracts`:

- `node_modules/@twf/contracts/dist/socket.d.ts`
- `node_modules/@twf/contracts/dist/room.d.ts`

### Client -> Server events

| Event                      | Payload                                    |
| -------------------------- | ------------------------------------------ |
| `room:create`              | `{ role: "host" \| "player" }`             |
| `room:join`                | `{ code, role, name?, clientId }`          |
| `room:setTierSet`          | `{ tierSetId }`                            |
| `room:bootPlayerFromLobby` | `{ playerId }`                             |
| `room:start`               | `{ code }`                                 |
| `room:close`               | none                                       |
| `tierSets:list`            | none                                       |
| `tierSets:get`             | `{ id }`                                   |
| `game:place`               | `{ tierId }`                               |
| `game:vote`                | `{ vote }` where vote is `-1`, `0`, or `1` |
| `debug:togglePause`        | none                                       |
| `debug:next`               | none                                       |
| `debug:prev`               | none                                       |

### Server -> Client events

| Event             | Payload                |
| ----------------- | ---------------------- |
| `room:created`    | `{ code }`             |
| `room:joined`     | `{ playerId }`         |
| `room:state`      | full `RoomPublicState` |
| `room:error`      | `string` error message |
| `room:closed`     | none                   |
| `room:kicked`     | none                   |
| `tierSets:listed` | `{ tierSets }`         |
| `tierSets:got`    | `{ tierSet }`          |

Note:

- `room:start` is typed in contracts as `{ code }`, but current server logic starts the game based on the socket's joined room and does not read the payload value.

## Runtime Constraints

- Room and player input constraints are enforced server-side and defined in `@twf/contracts`.
- `room:join` normalizes room code to uppercase.
- Rejoining with the same `clientId` restores host/player identity for reconnect flow.

### Minimal client connection example

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:<PORT>", {
  withCredentials: true,
});

socket.on("connect", () => {
  socket.emit("room:create", { role: "host" });
});

socket.on("room:created", ({ code }) => {
  console.log("Room code:", code);
});

socket.on("room:state", (state) => {
  console.log("Phase:", state.phase);
});

socket.on("room:error", (message) => {
  console.error(message);
});
```

## Game Lifecycle

Phases:

`LOBBY -> STARTING -> PLACE -> VOTE -> RESULTS -> DRIFT -> RESOLVE -> ... -> FINISHED`

Phase timings are intentionally not duplicated here.
Use `src/lib/timing.ts` as the source of truth.

Behavior notes:

- Host must choose a tier set before `room:start`.
- If current player does not place before `PLACE` timeout, turn advances and same item continues.
- Placing player cannot vote on their own item.
- Missing votes are treated as `0` (agree) when resolving.
- If nobody votes, result resolves as full agreement.
- Game ends when all items are placed.

## Room Lifetime and Cleanup

Rooms are stored in memory (no database).

A room can be removed by:

- Host closing room (`room:close`)
- All sockets disconnecting (room deleted when empty)
- Janitor TTL expiry (`ROOM_TTL_MS`) on periodic cleanup (`CLEANUP_INTERVAL_MS`)
- Server restart/crash (all rooms lost)

## Project Structure

```text
src/
  index.ts                    # Express + Socket.IO bootstrap
  socket/
    index.ts                  # Event registration
    handlers/                 # Room, game, tier set, debug handlers
  lib/
    game.ts                   # Core game state transitions
    timing.ts                 # Timer scheduling for phase auto-advance
    rooms.ts                  # In-memory room registry and reconnection maps
    roomCleanup.ts            # Janitor sweep logic
  tierSets/
    builtIns.ts               # Built-in tier set presets
    registry.ts               # Tier set lookup/list
```

## Deployment Notes

- Set `CLIENT_ORIGINS` to your frontend origin list (exact scheme/host/port).
- This server is stateful and in-memory. Horizontal scaling is not safe without shared room state + shared Socket.IO adapter.
- If running behind a reverse proxy/load balancer, ensure WebSocket upgrade support is enabled.
- Use process manager/service supervisor (PM2, systemd, container orchestrator) for restart policy.

## Troubleshooting

`npm install` fails for `@twf/contracts`:

- Install Git and retry. The package is pulled from GitHub.

CORS/websocket handshake blocked:

- Ensure your frontend origin is included in `CLIENT_ORIGINS`.

Port already in use:

- Change `PORT` in `.env` or stop the process using that port.

Debug controls not working:

- Set `ENABLE_DEBUG_CONTROLS=true` and reconnect as host.

Room disappears unexpectedly:

- Check `ROOM_TTL_MS`, `CLEANUP_INTERVAL_MS`, or empty-room disconnect behavior.
