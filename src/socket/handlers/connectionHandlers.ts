import { getRoom, detachSocket, deleteRoomIfEmpty } from "../../lib/rooms.js";
import { IOServer, IOSocket, emitState } from "../emit.js";

/**
 * Handles disconnection events.  Detaches sockets without removing players so
 * that they can reconnect later.  Deletes the room only if there are no active
 * displays or controllers.
 */
export function handleDisconnectFromRoom(io: IOServer, socket: IOSocket) {
  return () => {
    for (const roomCode of socket.rooms) {
      if (roomCode === socket.id) continue;

      const room = getRoom(roomCode);
      if (!room) continue;

      detachSocket(room, socket.id);

      const deleted = deleteRoomIfEmpty(room);
      if (!deleted) emitState(io, room.code, room.state);
    }
  };
}
