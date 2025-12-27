import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  RoomPublicState,
  ServerToClientEvents,
} from "@twf/contracts";

export type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export const emitState = (
  io: IOServer,
  code: string,
  state: RoomPublicState
) => {
  io.to(code).emit("room:state", state);
};

export const emitError = (socket: IOSocket, message: string) => {
  socket.emit("room:error", message);
};
