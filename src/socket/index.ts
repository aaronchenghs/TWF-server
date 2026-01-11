import { IOServer, IOSocket } from "./emit.js";
import {
  handleCreate,
  handleJoin,
  handleCloseRoom,
  handleSetTierSet,
} from "./handlers/roomHandlers.js";
import {
  handleTierSetsList,
  handleTierSetsGet,
} from "./handlers/tierSetHandlers.js";
import { handleDisconnectFromRoom } from "./handlers/connectionHandlers.js";
import {
  handlePlaceItem,
  handleStart,
  handleVote,
} from "./handlers/gameHandlers.js";
import {
  handleDebugNext,
  handleDebugPrev,
  handleDebugTogglePause,
} from "./handlers/debugHandlers.js";

function registerPerSocketHandlers(io: IOServer, socket: IOSocket) {
  socket.on("room:create", handleCreate(io, socket));
  socket.on("room:join", handleJoin(io, socket));
  socket.on("room:close", handleCloseRoom(io, socket));
  socket.on("room:setTierSet", handleSetTierSet(io, socket));
  socket.on("room:start", handleStart(io, socket));

  socket.on("disconnecting", handleDisconnectFromRoom(io, socket));

  socket.on("tierSets:list", handleTierSetsList(socket));
  socket.on("tierSets:get", handleTierSetsGet(socket));

  socket.on("game:place", handlePlaceItem(io, socket));
  socket.on("game:vote", handleVote(io, socket));

  socket.on("debug:next", handleDebugNext(io, socket));
  socket.on("debug:prev", handleDebugPrev(io, socket));
  socket.on("debug:togglePause", handleDebugTogglePause(io, socket));
}

export function registerSocketHandlers(io: IOServer) {
  io.on("connection", (socket) => {
    registerPerSocketHandlers(io, socket);
  });
}
