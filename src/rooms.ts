import { Role, RoomCode, RoomPublicState } from "@twf/contracts";
import { makeCode } from "./lib.js";
import { Guid, newGuid } from "./types/guid.js";
import type { Room } from "./types/types.js";

const rooms = new Map<RoomCode, Room>();

export function getRoom(code: RoomCode): Room | null {
  return rooms.get(code) ?? null;
}

export function createRoom(creatorSocketId: string, initialRole: Role): Room {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const state: RoomPublicState = {
    code,
    phase: "LOBBY",
    players: [],
    tiers: {},
    currentTurnPlayerId: null,
    currentItem: null,
    timers: { discussEndsAt: null, voteEndsAt: null },
    tierSetId: null,
  };

  const room: Room = {
    code,
    state,
    adminConnectionId: creatorSocketId,
    displayConnectionIds: new Set<string>(),
    controllerBySocketId: new Map<string, Guid>(),
  };

  if (initialRole === "host") room.displayConnectionIds.add(creatorSocketId);

  rooms.set(code, room);
  return room;
}

export function joinAsHost(room: Room, socketId: string) {
  room.displayConnectionIds.add(socketId);
}

export function joinAsPlayer(room: Room, socketId: string, name: string) {
  const safeName = name.trim().slice(0, 18);
  if (!safeName) throw new Error("Name required");

  const existingPlayerId = room.controllerBySocketId.get(socketId);
  if (existingPlayerId) return;

  const playerId = newGuid();
  room.controllerBySocketId.set(socketId, playerId);

  room.state.players.push({
    id: playerId,
    name: safeName,
    joinedAt: Date.now(),
  });
}

export function removeConnectionFromRoom(room: Room, socketId: string) {
  room.displayConnectionIds.delete(socketId);

  const playerId = room.controllerBySocketId.get(socketId);
  if (playerId) {
    room.controllerBySocketId.delete(socketId);
    room.state.players = room.state.players.filter((p) => p.id !== playerId);

    if (room.state.currentTurnPlayerId === playerId) {
      room.state.currentTurnPlayerId = null;
      room.state.currentItem = null;
    }
  }

  if (room.adminConnectionId === socketId) room.adminConnectionId = null;
}

export function deleteRoomIfEmpty(room: Room) {
  const hasAnyConnections =
    room.displayConnectionIds.size > 0 || room.state.players.length > 0;
  if (!hasAnyConnections) rooms.delete(room.code);
  return !hasAnyConnections;
}

export function allRooms(): IterableIterator<Room> {
  return rooms.values();
}
