import type { Role, TierSetId, ClientId, PlayerId } from "@twf/contracts";
import {
  buildTierSetMeta,
  makeEmptyTiers,
  normalizeCode,
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
  findRoomBySocket,
  getClientIdForPlayer,
} from "../../lib/rooms.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors.js";
import { Guid } from "../../types/guid.js";
import { NULL_TIMERS, clearRoomTimers } from "../../lib/timing.js";
import type { Room } from "../../types/types.js";

/**
 * Handles a client's request to create a new room.
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
 * Handles a client's request to join an existing room. Accepts a persistent
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

    const { tierMetaById, itemMetaById } = buildTierSetMeta(tierSetDefinition);

    room.state = {
      ...room.state,
      tierSetId: tierSetDefinition.id,
      tiers: makeEmptyTiers(tierSetDefinition),
      tierOrder: tierSetDefinition.tiers.map((t) => t.id),
      tierMetaById,
      itemMetaById,
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

async function startRematchLobby(io: IOServer, room: Room) {
  clearRoomTimers(room.code);
  room.itemQueue = [];
  room.rematch.hostStarted = true;

  const nextPlayers: typeof room.state.players = [];

  for (const player of room.state.players) {
    const playerId = player.id as Guid;
    const isQueued = room.rematch.queuedPlayerIds.has(playerId);
    const activeSocketId = room.socketIdByControllerId.get(playerId) ?? null;

    if (isQueued) {
      nextPlayers.push({
        ...player,
        connected: Boolean(activeSocketId),
      });
      continue;
    }

    const clientId = getClientIdForPlayer(room, playerId);
    if (!clientId) continue;

    const deferred = room.rematch.deferredByClientId.get(clientId) ?? {
      id: playerId,
      name: player.name,
      joinedAt: player.joinedAt,
      clientId,
      socketIds: new Set<string>(),
    };

    deferred.id = playerId;
    deferred.name = player.name;
    deferred.joinedAt = player.joinedAt;
    room.rematch.deferredByClientId.set(clientId, deferred);

    room.controllerByClientId.delete(clientId);

    if (!activeSocketId) continue;

    room.controllerBySocketId.delete(activeSocketId);
    room.socketIdByControllerId.delete(playerId);
    room.rematch.deferredClientIdBySocketId.set(activeSocketId, clientId);
    room.clientIdBySocketId.set(activeSocketId, clientId);
    deferred.socketIds.add(activeSocketId);

    const targetSocket = io.sockets.sockets.get(activeSocketId);
    if (targetSocket) {
      targetSocket.emit("room:playAgainStarted");
      await targetSocket.leave(room.code);
    }
  }

  room.rematch.queuedPlayerIds.clear();

  const resetTiers: typeof room.state.tiers = {};
  for (const tierId of room.state.tierOrder) {
    resetTiers[tierId] = [];
  }

  room.state = {
    ...room.state,
    phase: "LOBBY",
    players: nextPlayers,
    turnOrderPlayerIds: [],
    turnIndex: 0,
    currentTurnPlayerId: null,
    currentItem: null,
    pendingTierId: null,
    votes: {},
    lastResolution: null,
    timers: NULL_TIMERS,
    tiers: resetTiers,
  };

  touchRoom(room);
  emitState(io, room.code, room.state);
}

async function rejoinDeferredPlayer(
  io: IOServer,
  socket: IOSocket,
  room: Room,
) {
  const clientId = room.rematch.deferredClientIdBySocketId.get(socket.id);
  if (!clientId) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));
  const deferred = room.rematch.deferredByClientId.get(clientId);
  if (!deferred) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));

  for (const sid of deferred.socketIds) {
    room.rematch.deferredClientIdBySocketId.delete(sid);
    room.clientIdBySocketId.delete(sid);
  }

  room.rematch.deferredByClientId.delete(clientId);

  room.controllerByClientId.set(clientId, deferred.id);
  room.controllerBySocketId.set(socket.id, deferred.id);
  room.clientIdBySocketId.set(socket.id, clientId);
  room.socketIdByControllerId.set(deferred.id, socket.id);

  if (!room.state.players.some((p) => p.id === deferred.id)) {
    room.state.players.push({
      id: deferred.id,
      name: deferred.name,
      joinedAt: deferred.joinedAt,
      connected: true,
    });
  }

  await socket.join(room.code);
  socket.emit("room:joined", { playerId: deferred.id });

  touchRoom(room);
  emitState(io, room.code, room.state);
}

/**
 * Handles rematch flow from FINISHED:
 * - players queue themselves while waiting for host
 * - host restarts to LOBBY with only queued players
 * - deferred players can click again later to rejoin that LOBBY
 */
export function handlePlayAgain(io: IOServer, socket: IOSocket) {
  return async () => {
    const room = findRoomBySocket(socket.id);
    if (!room) return emitError(socket, getErrorMessage("NOT_IN_ROOM"));

    const isHost = room.adminConnectionId === socket.id;
    const activePlayerId = room.controllerBySocketId.get(socket.id);
    const isDeferred = room.rematch.deferredClientIdBySocketId.has(socket.id);

    if (isHost) {
      if (room.state.phase !== "FINISHED")
        return emitError(socket, getErrorMessage("INVALID_PHASE"));
      await startRematchLobby(io, room);
      return;
    }

    if (activePlayerId) {
      if (room.state.phase === "FINISHED" && !room.rematch.hostStarted) {
        room.rematch.queuedPlayerIds.add(activePlayerId);
        touchRoom(room);
        socket.emit("room:playAgainQueued");
        return;
      }

      if (room.rematch.hostStarted && room.state.phase === "LOBBY") {
        // Idempotent click after already rejoined.
        socket.emit("room:state", room.state);
        return;
      }

      return emitError(socket, getErrorMessage("INVALID_PHASE"));
    }

    if (isDeferred) {
      if (!room.rematch.hostStarted || room.state.phase !== "LOBBY")
        return emitError(socket, getErrorMessage("INVALID_PHASE"));
      await rejoinDeferredPlayer(io, socket, room);
      return;
    }

    emitError(socket, getErrorMessage("NOT_A_PLAYER"));
  };
}

export function handleCloseRoom(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));

    const deferredSocketIds = [
      ...room.rematch.deferredClientIdBySocketId.keys(),
    ];

    io.to(room.code).emit("room:closed");
    io.in(room.code).disconnectSockets(true);

    for (const sid of deferredSocketIds) {
      const deferredSocket = io.sockets.sockets.get(sid);
      if (!deferredSocket) continue;
      deferredSocket.emit("room:closed");
      deferredSocket.disconnect(true);
    }

    deleteRoom(room);
  };
}
