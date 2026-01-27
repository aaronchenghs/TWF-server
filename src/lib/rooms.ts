// TWF-server/src/lib/rooms.ts

import {
  LOBBY_CAPACITY,
  MAX_NAME_LENGTH,
  Role,
  RoomCode,
  RoomPublicState,
  ClientId,
} from "@twf/contracts";
import { makeCode, normalizeName } from "./general.js";
import { newGuid } from "../types/guid.js";
import type { Room } from "../types/types.js";
import { getErrorMessage, getNameTakenMessage } from "./errors.js";
import { emitError, IOSocket } from "../socket/emit.js";
import { NULL_TIMERS } from "./timing.js";

/**
 * In-memory registry of active rooms.
 * Each entry is keyed by its 4‑letter code.
 */
const rooms = new Map<RoomCode, Room>();

export function getRoom(code: RoomCode): Room | null {
  return rooms.get(code) ?? null;
}

/**
 * Creates a new room.  The adminClientId is not yet known here; it will be set
 * on the first call to joinAsHost() after creation.  The host’s socket.id is
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
    timer: null,
    scheduleNonce: 0,
    debugHistory: [],
    createdAt: now,
    lastActivityAt: now,
  };

  if (initialRole === "host") {
    room.displayConnectionIds.add(creatorSocketId);
  }
  rooms.set(code, room);
  return room;
}

/**
 * Host join.  Allows reattachment in any phase if the same clientId is used.
 * On first join after creation, this sets the room.adminClientId.
 * Throws if a different device attempts to join after the lobby has started.
 */
export function joinAsHost(
  room: Room,
  socketId: string,
  clientId: ClientId,
): void {
  if (room.adminClientId === null) {
    // first host join after create
    room.adminClientId = clientId;
  } else if (room.adminClientId !== clientId) {
    throw new Error(getErrorMessage("NOT_AUTHORIZED"));
  }

  // If someone attempts to switch hosts after lobby start, forbid it
  if (room.adminClientId === clientId) {
    room.adminConnectionId = socketId;
    room.displayConnectionIds.add(socketId);
    room.clientIdBySocketId.set(socketId, clientId);
    touchRoom(room);
    return;
  }

  // Should never reach here, but guard anyway
  throw new Error(getErrorMessage("NOT_AUTHORIZED"));
}

/**
 * Player join.  If the clientId has played before, this reattaches their socket
 * to the existing player without changing the player’s name. If the clientId is
 * new, the lobby must still be open and capacity not exceeded. The returned
 * playerId is used by front‑end to set myPlayerId. Catches duplicate names.
 */
export function joinAsPlayer(
  room: Room,
  socketId: string,
  clientId: ClientId,
  name: string,
): string {
  const proposedName = normalizeName(name);
  const existingPlayerId = room.controllerByClientId.get(clientId);

  // =========================
  // RESUME / RECONNECT
  // =========================
  if (existingPlayerId) {
    const oldSocketId = room.socketIdByControllerId.get(existingPlayerId);
    if (oldSocketId) {
      room.controllerBySocketId.delete(oldSocketId);
      room.clientIdBySocketId.delete(oldSocketId);
    }

    room.controllerBySocketId.set(socketId, existingPlayerId);
    room.clientIdBySocketId.set(socketId, clientId);
    room.socketIdByControllerId.set(existingPlayerId, socketId);

    const me = room.state.players.find((p) => p.id === existingPlayerId);
    if (me) me.connected = true;

    // If the game has NOT started, allow this device to change its name
    if (room.state.phase === "LOBBY") {
      const safeName = proposedName.trim().slice(0, MAX_NAME_LENGTH);
      if (!safeName) throw new Error(getErrorMessage("NAME_REQUIRED"));

      const isNameDuplicate = room.state.players.some((p) => {
        if (p.id === existingPlayerId) return false;
        return (
          normalizeName(p.name).toLowerCase() === proposedName.toLowerCase()
        );
      });

      if (isNameDuplicate) throw new Error(getNameTakenMessage(proposedName));
      if (me) me.name = safeName;
    }

    touchRoom(room);
    return existingPlayerId;
  }

  // =========================
  // NEW JOIN
  // =========================
  if (room.state.phase !== "LOBBY")
    throw new Error(getErrorMessage("LOBBY_STARTED"));

  const safeName = proposedName.trim().slice(0, MAX_NAME_LENGTH);
  if (!safeName) throw new Error(getErrorMessage("NAME_REQUIRED"));

  const isNameDuplicate = room.state.players.some(
    (p) => normalizeName(p.name).toLowerCase() === proposedName.toLowerCase(),
  );
  if (isNameDuplicate) throw new Error(getNameTakenMessage(proposedName));

  const playerId = newGuid();

  room.controllerByClientId.set(clientId, playerId);
  room.controllerBySocketId.set(socketId, playerId);
  room.clientIdBySocketId.set(socketId, clientId);
  room.socketIdByControllerId.set(playerId, socketId);

  room.state.players.push({
    id: playerId,
    name: safeName,
    joinedAt: Date.now(),
    connected: true,
  });

  touchRoom(room);
  return playerId;
}

/**
 * Detaches a socket from its controller or host.  It does not remove players
 * from the lobby so that they can reconnect later.  The room will remain until
 * the janitor expires it or all controllers/displays disconnect and the host
 * closes it.
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

/**
 * Deletes a room only if there are zero connected displays AND zero connected
 * controllers.  Unlike the previous implementation, the presence of a player
 * in the players array does not prevent deletion—only active socket mappings.
 */
export function deleteRoomIfEmpty(room: Room): boolean {
  const hasAnyConnections =
    room.displayConnectionIds.size > 0 || room.controllerBySocketId.size > 0;
  if (!hasAnyConnections) rooms.delete(room.code);
  return !hasAnyConnections;
}

export function deleteRoom(room: Room): void {
  rooms.delete(room.code);
}

export function getAllRooms(): IterableIterator<Room> {
  return rooms.values();
}

/**
 * Looks up the room in which this socket currently resides.  Emits an error if
 * the socket is not in any room or if the room no longer exists.  Returns null
 * on error.
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
