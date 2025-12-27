import {
  getRoom,
  removeConnectionFromRoom,
  deleteRoomIfEmpty,
} from "../../lib/rooms";
import { IOServer, IOSocket, emitState } from "../emit";

export function handleDisconnectFromRoom(io: IOServer, socket: IOSocket) {
  return () => {
    for (const roomCode of socket.rooms) {
      if (roomCode === socket.id) continue;

      const room = getRoom(roomCode);
      if (!room) continue;

      removeConnectionFromRoom(room, socket.id);

      const deleted = deleteRoomIfEmpty(room);
      if (!deleted) emitState(io, room.code, room.state);
    }
  };
}
