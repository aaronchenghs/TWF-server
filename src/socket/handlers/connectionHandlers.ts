import {
  getRoom,
  findRoomBySocket,
  detachSocket,
  removeDeferredSocket,
  deleteRoomIfEmpty,
  deleteRoom,
} from "../../lib/rooms.js";
import { beginResults, getEligibleVoterIds } from "../../lib/game.js";
import { reschedule } from "../../lib/timing.js";
import { getTierSet } from "../../tierSets/registry.js";
import { IOServer, IOSocket, emitState } from "../emit.js";
import type { Room } from "../../types/types.js";

function shouldFinalizeVoteImmediately(room: Room): boolean {
  if (room.state.phase !== "VOTE") return false;

  const eligibleVoterIds = getEligibleVoterIds(room);
  const have = eligibleVoterIds.filter(
    (playerId) => room.state.votes[playerId] !== undefined,
  ).length;

  return have >= eligibleVoterIds.length;
}

/**
 * Handles disconnection events.
 * - Regular members are detached so they can reconnect.
 * - Host disconnect in FINISHED (before rematch start) closes the room for all.
 * - Deferred rematch sockets are cleaned up even though they are not in socket.rooms.
 */
export function handleDisconnectFromRoom(io: IOServer, socket: IOSocket) {
  return () => {
    for (const roomCode of socket.rooms) {
      if (roomCode === socket.id) continue;

      const room = getRoom(roomCode);
      if (!room) continue;

      const wasHost = room.adminConnectionId === socket.id;
      if (
        wasHost &&
        room.state.phase === "FINISHED" &&
        !room.rematch.hostStarted
      ) {
        const deferredSocketIds = [
          ...room.rematch.deferredClientIdBySocketId.keys(),
        ];

        io.to(room.code).emit("room:closed");
        io.in(room.code).disconnectSockets(true);

        for (const sid of deferredSocketIds) {
          if (sid === socket.id) continue;
          const deferredSocket = io.sockets.sockets.get(sid);
          if (!deferredSocket) continue;
          deferredSocket.emit("room:closed");
          deferredSocket.disconnect(true);
        }

        deleteRoom(room);
        continue;
      }

      detachSocket(room, socket.id);

      if (shouldFinalizeVoteImmediately(room)) {
        beginResults(room, Date.now());

        const deleted = deleteRoomIfEmpty(room);
        if (!deleted) {
          emitState(io, room.code, room.state);
          reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
        }
        continue;
      }

      const deleted = deleteRoomIfEmpty(room);
      if (!deleted) emitState(io, room.code, room.state);
    }

    // Deferred rematch sockets are intentionally removed from socket.io room membership.
    const deferredRoom = findRoomBySocket(socket.id);
    if (
      deferredRoom &&
      deferredRoom.rematch.deferredClientIdBySocketId.has(socket.id)
    ) {
      removeDeferredSocket(deferredRoom, socket.id);
    }
  };
}
