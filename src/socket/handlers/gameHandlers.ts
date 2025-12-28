import { gameStart } from "../../lib/game";
import { getRoom } from "../../lib/rooms";
import { reschedule } from "../../lib/timers";
import { getTierSet } from "../../tierSets/registry.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";

export function handleStart(io: IOServer, socket: IOSocket) {
  return () => {
    const roomCode = [...socket.rooms].find((room) => room !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");

    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, "Only host can start game.");
    if (room.state.phase !== "LOBBY")
      return emitError(socket, "Game already started.");
    if (!room.state.tierSetId)
      return emitError(socket, "Select a tier set first.");
    if (room.state.players.length < 1)
      return emitError(socket, "Need at least 1 player.");

    const selectedTierSet = getTierSet(room.state.tierSetId);
    if (!selectedTierSet) return emitError(socket, "Unknown tier set.");

    gameStart(room, selectedTierSet, Date.now());
    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}
