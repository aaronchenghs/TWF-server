import {
  MAX_NAME_LENGTH,
  Role,
  RoomCode,
  RoomPublicState,
  ClientId,
} from "@twf/contracts";
import { getSafeNameOrThrow, makeCode, normalizeName } from "./general.js";
import { Guid, newGuid } from "../types/guid.js";
import type { Room } from "../types/types.js";
import { getErrorMessage, getNameTakenMessage } from "./errors.js";
import { emitError, IOSocket } from "../socket/emit.js";
import { NULL_TIMERS, clearRoomTimers } from "./timing.js";
import { createRandomAvatar } from "./avatar.js";

/**
 * In-memory registry of active rooms.
 * Each entry is keyed by its 4-letter code.
 */
const rooms = new Map<RoomCode, Room>();

export function getRoom(code: RoomCode): Room | null {
  return rooms.get(code) ?? null;
}

/**
 * Creates a new room. The adminClientId is not yet known here; it will be set
 * on the first call to joinAsHost() after creation. The host's socket.id is
 * stored as adminConnectionId so the creator can perform admin actions until
 * they explicitly join.
 */
export function createRoom(creatorSocketId: string, initialRole: Role): Room {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const state: RoomPublicState = {
    code,
    phase: "LOBBY",
    players: [],
    turnOrderPlayerIds: [],
    turnIndex: 0,
    currentTurnPlayerId: null,
    tiers: {},
    currentItem: null,
    votes: {},
    voteConfirmedByPlayerId: {},
    lastResolution: null,
    tierOrder: [],
    timers: NULL_TIMERS,
    tierSetId: null,
    pendingTierId: null,
  };

  const now = Date.now();
  const room: Room = {
    code,
    state,
    adminConnectionId: creatorSocketId,
    adminClientId: null, // assigned on first joinAsHost()
    displayConnectionIds: new Set<string>(),
    controllerBySocketId: new Map<string, ReturnType<typeof newGuid>>(),
    controllerByClientId: new Map<ClientId, ReturnType<typeof newGuid>>(),
    clientIdBySocketId: new Map<string, ClientId>(),
    socketIdByControllerId: new Map<ReturnType<typeof newGuid>, string>(),
    itemQueue: [],
    debugHistory: [],
    createdAt: now,
    lastActivityAt: now,
    rematch: {
      queuedPlayerIds: new Set(),
      hostStarted: false,
      deferredByClientId: new Map(),
      deferredClientIdBySocketId: new Map(),
    },
  };

  if (initialRole === "host") room.displayConnectionIds.add(creatorSocketId);
  rooms.set(code, room);
  return room;
}

/**
 * Host join. Allows reattachment in any phase if the same clientId is used.
 * On first join after creation, this sets the room.adminClientId.
 * Throws if a different device attempts to join after the lobby has started.
 */
export function joinAsHost(
  room: Room,
  socketId: string,
  clientId: ClientId,
): void {
  if (room.adminClientId === null) {
    room.adminClientId = clientId;
  } else if (room.adminClientId !== clientId) {
    throw new Error(getErrorMessage("NOT_AUTHORIZED"));
  }

  if (room.adminClientId === clientId) {
    room.adminConnectionId = socketId;
    room.displayConnectionIds.add(socketId);
    room.clientIdBySocketId.set(socketId, clientId);
    touchRoom(room);
    return;
  }

  throw new Error(getErrorMessage("NOT_AUTHORIZED"));
}

/**
 * Player join.
 * - Existing active player: reconnect to same player.
 * - Deferred rematch player: rejoin the current rematch lobby.
 * - New player: allowed only while phase is LOBBY.
 */
export function joinAsPlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  name: string,
): string {
  const proposedName = normalizeName(name);

  const activePlayerId = tryResumeActivePlayer(
    room,
    socketId,
    clientId,
    proposedName,
  );
  if (activePlayerId) {
    touchRoom(room);
    return activePlayerId;
  }

  const deferredPlayerId = tryResumeDeferredRematchPlayer(
    room,
    socketId,
    clientId,
    proposedName,
  );
  if (deferredPlayerId) {
    touchRoom(room);
    return deferredPlayerId;
  }

  const playerId = createNewLobbyPlayer(room, socketId, clientId, proposedName);

  touchRoom(room);
  return playerId;
}

/**
 * Detaches a socket from its controller or host. It does not remove players
 * from the lobby so that they can reconnect later.
 */
export function detachSocket(room: Room, socketId: string): void {
  room.displayConnectionIds.delete(socketId);

  const playerId = room.controllerBySocketId.get(socketId);
  if (playerId) {
    room.controllerBySocketId.delete(socketId);
    room.clientIdBySocketId.delete(socketId);
    room.socketIdByControllerId.delete(playerId);

    const p = room.state.players.find((x) => x.id === playerId);
    if (p) p.connected = false;
  } else {
    const clientId = room.clientIdBySocketId.get(socketId);
    if (clientId) room.clientIdBySocketId.delete(socketId);
  }

  if (room.adminConnectionId === socketId) {
    room.adminConnectionId = null;
  }

  touchRoom(room);
}

export function removeDeferredSocket(room: Room, socketId: string): void {
  const clientId = room.rematch.deferredClientIdBySocketId.get(socketId);
  if (!clientId) return;

  room.rematch.deferredClientIdBySocketId.delete(socketId);
  room.clientIdBySocketId.delete(socketId);

  const deferred = room.rematch.deferredByClientId.get(clientId);
  if (deferred) deferred.socketIds.delete(socketId);

  touchRoom(room);
}

export function getClientIdForPlayer(
  room: Room,
  playerId: string,
): ClientId | null {
  for (const [
    clientId,
    mappedPlayerId,
  ] of room.controllerByClientId.entries()) {
    if (mappedPlayerId === playerId) return clientId;
  }
  return null;
}

/**
 * Finds a room by direct socket association. This includes deferred rematch
 * sockets that are intentionally removed from the Socket.IO room membership.
 */
export function findRoomBySocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.adminConnectionId === socketId) return room;
    if (room.displayConnectionIds.has(socketId)) return room;
    if (room.controllerBySocketId.has(socketId)) return room;
    if (room.rematch.deferredClientIdBySocketId.has(socketId)) return room;
  }
  return null;
}

/**
 * Deletes a room only if there are zero connected displays AND zero connected
 * controllers.
 */
export function deleteRoomIfEmpty(room: Room): boolean {
  const hasAnyConnections =
    room.displayConnectionIds.size > 0 || room.controllerBySocketId.size > 0;
  if (!hasAnyConnections) {
    clearRoomTimers(room.code);
    rooms.delete(room.code);
    return true;
  }
  return false;
}

export function deleteRoom(room: Room): void {
  clearRoomTimers(room.code);
  rooms.delete(room.code);
}

export function getAllRooms(): IterableIterator<Room> {
  return rooms.values();
}

/**
 * Looks up the room in which this socket currently resides. Emits an error if
 * the socket is not in any room or if the room no longer exists.
 */
export function requireRoom(socket: IOSocket): Room | null {
  const roomCode = [...socket.rooms].find((room) => room !== socket.id);
  if (!roomCode) {
    emitError(socket, getErrorMessage("NOT_IN_ROOM"));
    return null;
  }
  const room = getRoom(roomCode);
  if (!room) {
    emitError(socket, getErrorMessage("LOBBY_NOT_FOUND"));
    return null;
  }
  return room;
}

export function touchRoom(room: Room): void {
  room.lastActivityAt = Date.now();
}

// #region helpers for player join logic

function assertUniquePlayerName(
  room: Room,
  proposedName: string,
  excludePlayerId?: Guid,
): void {
  const isNameDuplicate = room.state.players.some((player) => {
    if (excludePlayerId && player.id === excludePlayerId) return false;
    return (
      normalizeName(player.name).toLowerCase() === proposedName.toLowerCase()
    );
  });

  if (isNameDuplicate) throw new Error(getNameTakenMessage(proposedName));
}

function attachSocketToPlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  playerId: Guid,
): void {
  room.controllerBySocketId.set(socketId, playerId);
  room.clientIdBySocketId.set(socketId, clientId);
  room.socketIdByControllerId.set(playerId, socketId);
}

function registerController(
  room: Room,
  socketId: string,
  clientId: ClientId,
  playerId: Guid,
): void {
  room.controllerByClientId.set(clientId, playerId);
  attachSocketToPlayer(room, socketId, clientId, playerId);
}

function tryResumeActivePlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  proposedName: string,
): Guid | null {
  const existingPlayerId = room.controllerByClientId.get(clientId);
  if (!existingPlayerId) return null;

  const oldSocketId = room.socketIdByControllerId.get(existingPlayerId);
  if (oldSocketId) {
    room.controllerBySocketId.delete(oldSocketId);
    room.clientIdBySocketId.delete(oldSocketId);
  }

  attachSocketToPlayer(room, socketId, clientId, existingPlayerId);

  const me = room.state.players.find(
    (player) => player.id === existingPlayerId,
  );
  if (me) me.connected = true;

  // If the game has NOT started, allow this device to change its name
  if (room.state.phase === "LOBBY") {
    const safeName = getSafeNameOrThrow(proposedName);
    assertUniquePlayerName(room, proposedName, existingPlayerId);
    if (me) me.name = safeName;
  }

  return existingPlayerId;
}

function tryResumeDeferredRematchPlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  proposedName: string,
): Guid | null {
  const deferred = room.rematch.deferredByClientId.get(clientId);
  if (!deferred) return null;

  if (room.state.phase !== "LOBBY") {
    room.rematch.deferredByClientId.delete(clientId);

    registerController(room, socketId, clientId, deferred.id);

    if (!room.state.players.some((player) => player.id === deferred.id)) {
      room.state.players.push({
        id: deferred.id,
        name: deferred.name,
        avatar: deferred.avatar,
        joinedAt: deferred.joinedAt,
        connected: true,
      });
    } else {
      const existing = room.state.players.find(
        (player) => player.id === deferred.id,
      );
      if (existing) existing.connected = true;
    }

    const isActiveGamePhase = room.state.phase !== "FINISHED";
    if (
      isActiveGamePhase &&
      !room.state.turnOrderPlayerIds.includes(deferred.id)
    ) {
      room.state = {
        ...room.state,
        turnOrderPlayerIds: [...room.state.turnOrderPlayerIds, deferred.id],
      };
    }

    return deferred.id;
  }

  const safeName = getSafeNameOrThrow(proposedName);
  assertUniquePlayerName(room, proposedName);

  // Clear any old deferred socket references for this client.
  for (const sid of deferred.socketIds) {
    room.rematch.deferredClientIdBySocketId.delete(sid);
    room.clientIdBySocketId.delete(sid);
  }

  room.rematch.deferredByClientId.delete(clientId);
  registerController(room, socketId, clientId, deferred.id);

  room.state.players.push({
    id: deferred.id,
    name: safeName,
    avatar: deferred.avatar,
    joinedAt: deferred.joinedAt,
    connected: true,
  });

  return deferred.id;
}

function createNewLobbyPlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  proposedName: string,
): Guid {
  if (room.state.phase !== "LOBBY")
    throw new Error(getErrorMessage("LOBBY_STARTED"));

  const safeName = getSafeNameOrThrow(proposedName);
  assertUniquePlayerName(room, proposedName);

  const playerId = newGuid();
  registerController(room, socketId, clientId, playerId);

  room.state.players.push({
    id: playerId,
    name: safeName,
    avatar: createRandomAvatar(),
    joinedAt: Date.now(),
    connected: true,
  });

  return playerId;
}

// #endregion helpers for player join logic
