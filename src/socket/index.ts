import { IOServer, IOSocket } from "./emit.js";
import {
  handleCreate,
  handleJoin,
  handleCloseRoom,
  handleSetTierSet,
} from "./roomHandlers.js";
import { handleTierSetsList, handleTierSetsGet } from "./tierSetHandlers.js";
import { handleDisconnectFromRoom } from "./connectionHandlers.js";

function registerPerSocketHandlers(io: IOServer, socket: IOSocket) {
  socket.on("room:create", handleCreate(io, socket));
  socket.on("room:join", handleJoin(io, socket));
  socket.on("room:close", handleCloseRoom(io, socket));
  socket.on("room:setTierSet", handleSetTierSet(io, socket));

  socket.on("disconnecting", handleDisconnectFromRoom(io, socket));

  socket.on("tierSets:list", handleTierSetsList(socket));
  socket.on("tierSets:get", handleTierSetsGet(socket));
}

export function registerSocketHandlers(io: IOServer) {
  io.on("connection", (socket) => {
    registerPerSocketHandlers(io, socket);
  });
}
