import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  RoomPublicState,
  ServerToClientEvents,
} from "@twf/contracts";
import type { Room } from "../types/types.js";
import { scheduleRoomPersist } from "../lib/roomStore.js";

export type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export const emitRoomState = (io: IOServer, room: Room) => {
  scheduleRoomPersist(room);
  io.to(room.code).emit("room:state", room.state);
};

export const emitError = (socket: IOSocket, message: string) => {
  socket.emit("room:error", message);
};
