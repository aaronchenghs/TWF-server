import { allRooms, createRoom, deleteRoomIfEmpty, getRoom, joinAsController, joinAsDisplay, removeConnectionFromRoom, } from "./rooms.js";
export function registerSocketHandlers(io) {
    const broadcastState = (code, state) => {
        io.to(code).emit("room:state", state);
    };
    io.on("connection", (socket) => {
        socket.on("debug:ping", (ts) => socket.emit("debug:pong", ts));
        socket.on("room:create", ({ role }) => {
            const room = createRoom(socket.id, role);
            socket.join(room.code);
            broadcastState(room.code, room.state);
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
                joinAsDisplay(room, socket.id);
                broadcastState(room.code, room.state);
                return;
            }
            if (role === "controller") {
                try {
                    joinAsController(room, socket.id, name ?? "");
                    broadcastState(room.code, room.state);
                }
                catch (e) {
                    socket.emit("room:error", e instanceof Error ? e.message : "Join failed");
                }
                return;
            }
            // spectator
            broadcastState(room.code, room.state);
        });
        socket.on("disconnect", () => {
            for (const room of allRooms()) {
                if (!socket.rooms.has(room.code))
                    continue;
                removeConnectionFromRoom(room, socket.id);
                const deleted = deleteRoomIfEmpty(room);
                if (!deleted)
                    broadcastState(room.code, room.state);
            }
        });
    });
}
