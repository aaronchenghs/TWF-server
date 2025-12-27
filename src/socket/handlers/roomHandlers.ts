import type { Role, TierSetId } from "@twf/contracts";
import { makeEmptyTiers, normalizeCode } from "../../lib/general.js";
import { getTierSet } from "../../tierSets/registry.js";
import {
  createRoom,
  getRoom,
  joinAsHost,
  joinAsPlayer,
  deleteRoomIfEmpty,
} from "../../lib/rooms.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";

export function handleCreate(io: IOServer, socket: IOSocket) {
  return ({ role }: { role: Role }) => {
    const room = createRoom(socket.id, role);
    socket.join(room.code);
    socket.emit("room:created", { code: room.code });
    emitState(io, room.code, room.state);
  };
}

export function handleJoin(io: IOServer, socket: IOSocket) {
  return ({
    code,
    role,
    name,
  }: {
    code: string;
    role: Role;
    name?: string;
  }) => {
    const normalized = normalizeCode(code);
    const room = getRoom(normalized);

    if (!room) return emitError(socket, "Room not found");

    try {
      role === "host"
        ? joinAsHost(room, socket.id)
        : joinAsPlayer(room, socket.id, name ?? "");
      socket.join(room.code);
      emitState(io, room.code, room.state);
    } catch (e) {
      emitError(socket, e instanceof Error ? e.message : "Join failed");
    }
  };
}

export function handleSetTierSet(io: IOServer, socket: IOSocket) {
  return ({ tierSetId }: { tierSetId: TierSetId }) => {
    const roomCode = [...socket.rooms].find((r) => r !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");

    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, "Only host can set tier set.");
    if (room.state.phase !== "LOBBY")
      return emitError(socket, "Cannot change tier set after start.");

    const def = getTierSet(tierSetId);
    if (!def) return emitError(socket, "Unknown tier set.");

    room.state.tierSetId = def.id;
    room.state.tiers = makeEmptyTiers(def);
    room.state.currentItem = null;
    room.state.currentTurnPlayerId = null;

    emitState(io, room.code, room.state);
  };
}

export function handleCloseRoom(io: IOServer, socket: IOSocket) {
  return () => {
    const roomCode = [...socket.rooms].find((room) => room !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");

    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, "Only host can close lobby.");

    io.to(roomCode).emit("room:closed");
    io.in(roomCode).disconnectSockets(true);
    deleteRoomIfEmpty(room);
  };
}
