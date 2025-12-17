import type { Server } from "socket.io";
import {
  allRooms,
  createRoom,
  deleteRoomIfEmpty,
  getRoom,
  joinAsPlayer,
  joinAsHost,
  removeConnectionFromRoom,
} from "./rooms.js";
import { ClientToServerEvents, ServerToClientEvents } from "@twf/contracts";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const broadcastState = (code: string, state: unknown) => {
    io.to(code).emit("room:state", state as any);
  };

  io.on("connection", (socket) => {
    socket.on("room:create", ({ role }) => {
      const room = createRoom(socket.id, role);
      socket.join(room.code);
      socket.emit("room:created", { code: room.code });
      io.to(room.code).emit("room:state", room.state);
    });

    socket.on("room:join", ({ code, role, name }) => {
      const normalized = code.trim().toUpperCase();
      const room = getRoom(normalized);
      if (!room) {
        socket.emit("room:error", "Room not found");
        return;
      }

      socket.join(room.code);

      if (role === "display") {
        joinAsHost(room, socket.id);
        broadcastState(room.code, room.state);
        return;
      }

      if (role === "controller") {
        try {
          joinAsPlayer(room, socket.id, name ?? "");
          broadcastState(room.code, room.state);
        } catch (e) {
          socket.emit(
            "room:error",
            e instanceof Error ? e.message : "Join failed"
          );
        }
        return;
      }

      // spectator
      broadcastState(room.code, room.state);
    });

    socket.on("disconnect", () => {
      for (const room of allRooms()) {
        if (!socket.rooms.has(room.code)) continue;

        removeConnectionFromRoom(room, socket.id);

        const deleted = deleteRoomIfEmpty(room);
        if (!deleted) broadcastState(room.code, room.state);
      }
    });
  });
}
