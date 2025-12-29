import type { Role, TierSetId } from "@twf/contracts";
import { makeEmptyTiers, normalizeCode } from "../../lib/general.js";
import { getTierSet } from "../../tierSets/registry.js";
import {
  createRoom,
  getRoom,
  joinAsHost,
  joinAsPlayer,
  deleteRoomIfEmpty,
  requireRoom,
} from "../../lib/rooms.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors";

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

    if (!room) return emitError(socket, getErrorMessage("ROOM_NOT_FOUND"));

    try {
      role === "host"
        ? joinAsHost(room, socket.id)
        : joinAsPlayer(room, socket.id, name ?? "");
      socket.join(room.code);
      emitState(io, room.code, room.state);
    } catch (e) {
      emitError(
        socket,
        e instanceof Error ? e.message : getErrorMessage("JOIN_FAILED")
      );
    }
  };
}

export function handleSetTierSet(io: IOServer, socket: IOSocket) {
  return ({ tierSetId }: { tierSetId: TierSetId }) => {
    const room = requireRoom(socket);
    if (!room) return;

    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));
    if (room.state.phase !== "LOBBY")
      return emitError(socket, getErrorMessage("CANNOT_CHANGE_TIER_SET"));

    const def = getTierSet(tierSetId);
    if (!def) return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));

    room.state.tierSetId = def.id;
    room.state.tiers = makeEmptyTiers(def);
    room.state.currentItem = null;
    room.state.currentTurnPlayerId = null;

    emitState(io, room.code, room.state);
  };
}

export function handleCloseRoom(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;

    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));

    io.to(room.code).emit("room:closed");
    io.in(room.code).disconnectSockets(true);
    deleteRoomIfEmpty(room);
  };
}
