import type { Server, Socket } from "socket.io";
import {
  createRoom,
  deleteRoomIfEmpty,
  getRoom,
  joinAsHost,
  joinAsPlayer,
  removeConnectionFromRoom,
} from "./rooms.js";
import type {
  ClientToServerEvents,
  Role,
  ServerToClientEvents,
} from "@twf/contracts";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const normalizeCode = (code: string) => code.trim().toUpperCase();

const emitState = (io: IOServer, code: string, state: unknown) => {
  io.to(code).emit("room:state", state as any);
};

const emitError = (socket: IOSocket, message: string) => {
  socket.emit("room:error", message);
};

function handleCreate(io: IOServer, socket: IOSocket) {
  return ({ role }: { role: Role }) => {
    const room = createRoom(socket.id, role);
    socket.join(room.code);

    socket.emit("room:created", { code: room.code });
    emitState(io, room.code, room.state);
  };
}

function handleJoin(io: IOServer, socket: IOSocket) {
  return ({
    code,
    role,
    name,
  }: {
    code: string;
    role: string;
    name?: string;
  }) => {
    const normalized = normalizeCode(code);
    const room = getRoom(normalized);

    if (!room) {
      emitError(socket, "Room not found");
      return;
    }

    socket.join(room.code);

    switch (role) {
      case "display": {
        joinAsHost(room, socket.id);
        emitState(io, room.code, room.state);
        return;
      }

      case "controller": {
        try {
          joinAsPlayer(room, socket.id, name ?? "");
          emitState(io, room.code, room.state);
        } catch (e) {
          emitError(socket, e instanceof Error ? e.message : "Join failed");
        }
        return;
      }

      default: {
        // spectator (or unknown role)
        emitState(io, room.code, room.state);
        return;
      }
    }
  };
}

/**
 * Use `disconnecting` (not `disconnect`) so socket.rooms still contains the joined rooms.
 * Iterate the socket's rooms, not all rooms in memory.
 */
function handleDisconnecting(io: IOServer, socket: IOSocket) {
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

function registerPerSocketHandlers(io: IOServer, socket: IOSocket) {
  socket.on("room:create", handleCreate(io, socket));
  socket.on("room:join", handleJoin(io, socket));
  socket.on("disconnecting", handleDisconnecting(io, socket));
}

export function registerSocketHandlers(io: IOServer) {
  io.on("connection", (socket) => {
    registerPerSocketHandlers(io, socket);
  });
}
