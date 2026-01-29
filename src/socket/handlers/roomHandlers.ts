import type {
  Role,
  Tier,
  TierId,
  TierItem,
  TierItemId,
  TierSetId,
  ClientId,
  PlayerId,
} from "@twf/contracts";
import {
  makeEmptyTiers,
  normalizeCode,
  normalizeName,
} from "../../lib/general.js";
import { getTierSet } from "../../tierSets/registry.js";
import {
  createRoom,
  getRoom,
  joinAsHost,
  joinAsPlayer,
  requireRoom,
  deleteRoom,
  touchRoom,
  detachSocket,
} from "../../lib/rooms.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage, getNameTakenMessage } from "../../lib/errors";
import { clearRoomTimers } from "../../lib/timing.js";
import { Guid } from "../../types/guid.js";

/**
 * Handles a client’s request to create a new room.
 */
export function handleCreate(io: IOServer, socket: IOSocket) {
  return async ({ role }: { role: Role }) => {
    const room = createRoom(socket.id, role);
    await socket.join(room.code);
    socket.emit("room:created", { code: room.code });
    socket.emit("room:state", room.state);
    emitState(io, room.code, room.state);
  };
}

/**
 * Handles a client’s request to join an existing room. Accepts a persistent
 * clientId and reattaches the host/player if they have previously joined from
 * the same device.
 */
export function handleJoin(io: IOServer, socket: IOSocket) {
  return async ({
    code,
    role,
    name,
    clientId,
  }: {
    code: string;
    role: Role;
    name?: string;
    clientId: ClientId;
  }) => {
    const normalized = normalizeCode(code);
    const room = getRoom(normalized);
    if (!room) return emitError(socket, getErrorMessage("LOBBY_NOT_FOUND"));

    try {
      if (role === "host") joinAsHost(room, socket.id, clientId);
      else {
        const playerId = joinAsPlayer(room, socket.id, clientId, name ?? "");
        socket.emit("room:joined", { playerId });
      }

      await socket.join(room.code);
      socket.emit("room:state", room.state);
      touchRoom(room);
      emitState(io, room.code, room.state);
    } catch (e) {
      emitError(
        socket,
        e instanceof Error ? e.message : getErrorMessage("JOIN_FAILED"),
      );
    }
  };
}

/**
 * Allows the host to set the tier list before the game starts.
 */
export function handleSetTierSet(io: IOServer, socket: IOSocket) {
  return ({ tierSetId }: { tierSetId: TierSetId }) => {
    const room = requireRoom(socket);
    if (!room) return;
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));
    if (room.state.phase !== "LOBBY")
      return emitError(socket, getErrorMessage("CANNOT_CHANGE_TIER_SET"));
    const tierSetDefinition = getTierSet(tierSetId);
    if (!tierSetDefinition)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));

    const tierMeta: Record<TierId, Tier> = {};
    for (const tier of tierSetDefinition.tiers) tierMeta[tier.id] = tier;
    const itemMeta: Record<TierItemId, TierItem> = {};
    for (const item of tierSetDefinition.items ?? []) itemMeta[item.id] = item;

    room.state = {
      ...room.state,
      tierSetId: tierSetDefinition.id,
      tiers: makeEmptyTiers(tierSetDefinition),
      tierOrder: tierSetDefinition.tiers.map((t) => t.id),
      tierMetaById: tierMeta,
      itemMetaById: itemMeta,
      currentItem: null,
      currentTurnPlayerId: null,
      pendingTierId: null,
      votes: {},
      lastResolution: null,
    };

    touchRoom(room);
    emitState(io, room.code, room.state);
  };
}

export function handleBootPlayerFromLobby(io: IOServer, socket: IOSocket) {
  return ({ playerId }: { playerId: PlayerId }) => {
    const room = requireRoom(socket);
    if (!room) return;
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));
    if (room.state.phase !== "LOBBY")
      return emitError(socket, getErrorMessage("INVALID_PHASE"));

    const playerToBoot = room.state.players.find((p) => p.id === playerId);
    if (!playerToBoot) return;

    room.state = {
      ...room.state,
      players: room.state.players.filter((p) => p.id !== playerId),
    };

    const socketId = room.socketIdByControllerId.get(playerId as Guid);
    if (socketId) {
      const clientId = room.clientIdBySocketId.get(socketId);
      if (clientId) room.controllerByClientId.delete(clientId);
      detachSocket(room, socketId);

      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit("room:kicked");
        targetSocket.disconnect(true);
      }
    } else {
      // Fallback: remove any controller mapping for this player
      for (const [cid, pid] of room.controllerByClientId.entries()) {
        if (pid === playerId) {
          room.controllerByClientId.delete(cid);
          break;
        }
      }
    }

    touchRoom(room);
    emitState(io, room.code, room.state);
  };
}

export function handleCloseRoom(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));

    clearRoomTimers(room.code);
    io.to(room.code).emit("room:closed");
    io.in(room.code).disconnectSockets(true);
    deleteRoom(room);
  };
}
