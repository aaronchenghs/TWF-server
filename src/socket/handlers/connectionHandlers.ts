import {
  getRoom,
  findRoomBySocket,
  detachSocket,
  removeDeferredSocket,
  deleteRoomIfEmpty,
  closeRoomAndDisconnect,
} from "../../lib/rooms.js";
import { IOServer, IOSocket, emitRoomState } from "../emit.js";

/**
 * Handles disconnection events.
 * - Socket detaches from room state (host/player marked offline).
 * - Player entities remain so they can reconnect after accidental tab close.
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
        closeRoomAndDisconnect(io, room, socket.id);
        continue;
      }

      detachSocket(room, socket.id);

      const deleted = deleteRoomIfEmpty(room);
      if (!deleted) {
        emitRoomState(io, room);
      }
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
