import { emptyTiers, makeCode } from "./lib.js";
import { newGuid } from "./types/generics.js";
const rooms = new Map();
export function getRoom(code) {
    return rooms.get(code) ?? null;
}
export function createRoom(creatorSocketId, initialRole) {
    let code = makeCode();
    while (rooms.has(code))
        code = makeCode();
    const state = {
        code,
        phase: "LOBBY",
        players: [],
        tiers: emptyTiers(),
        currentTurnPlayerId: null,
        currentItem: null,
        timers: { discussEndsAt: null, voteEndsAt: null },
    };
    const room = {
        code,
        state,
        adminConnectionId: creatorSocketId,
        displayConnectionIds: new Set(),
        controllerBySocketId: new Map(),
    };
    if (initialRole === "display")
        room.displayConnectionIds.add(creatorSocketId);
    rooms.set(code, room);
    return room;
}
export function joinAsDisplay(room, socketId) {
    room.displayConnectionIds.add(socketId);
}
export function joinAsController(room, socketId, name) {
    const safeName = name.trim().slice(0, 18);
    if (!safeName)
        throw new Error("Name required");
    const existingPlayerId = room.controllerBySocketId.get(socketId);
    if (existingPlayerId)
        return;
    const playerId = newGuid();
    room.controllerBySocketId.set(socketId, playerId);
    room.state.players.push({
        id: playerId,
        name: safeName,
        joinedAt: Date.now(),
    });
}
export function removeConnectionFromRoom(room, socketId) {
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
    if (room.adminConnectionId === socketId)
        room.adminConnectionId = null;
}
export function deleteRoomIfEmpty(room) {
    const hasAnyConnections = room.displayConnectionIds.size > 0 || room.state.players.length > 0;
    if (!hasAnyConnections)
        rooms.delete(room.code);
    return !hasAnyConnections;
}
export function allRooms() {
    return rooms.values();
}
