import { TierId, VoteValue } from "@twf/contracts";
import {
  beginTurn,
  finalizeTurn,
  gameStart,
  getPlayerId,
} from "../../lib/game";
import { getRoom } from "../../lib/rooms";
import { reschedule, VOTE_MS } from "../../lib/timers";
import { getTierSet } from "../../tierSets/registry.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";

export function handleStart(io: IOServer, socket: IOSocket) {
  return () => {
    const roomCode = [...socket.rooms].find((room) => room !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");

    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");
    if (room.adminConnectionId !== socket.id)
      return emitError(socket, "Only host can start game.");
    if (room.state.phase !== "LOBBY")
      return emitError(socket, "Game already started.");
    if (!room.state.tierSetId)
      return emitError(socket, "Select a tier set first.");
    if (room.state.players.length < 1)
      return emitError(socket, "Need at least 1 player.");

    const selectedTierSet = getTierSet(room.state.tierSetId);
    if (!selectedTierSet) return emitError(socket, "Unknown tier set.");

    gameStart(room, selectedTierSet, Date.now());
    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}

export function handlePlace(io: IOServer, socket: IOSocket) {
  return ({ tierId }: { tierId: TierId }) => {
    const roomCode = [...socket.rooms].find((room) => room !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");
    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");

    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, "Not a player.");
    if (room.state.phase !== "PLACE") return emitError(socket, "Not in PLACE.");
    if (room.state.currentTurnPlayerId !== pid)
      return emitError(socket, "Not your turn.");
    if (!room.state.currentItem) return emitError(socket, "No current item.");
    if (!room.state.tiers[tierId]) return emitError(socket, "Invalid tier.");

    const isAlreadyPlaced = Object.values(room.state.tiers).some((arr) =>
      arr.includes(room.state.currentItem!)
    );
    if (isAlreadyPlaced) return emitError(socket, "Item already placed.");

    room.state = {
      ...room.state,
      pendingTierId: tierId,
      phase: "VOTE",
      votes: {},
      timers: {
        ...room.state.timers,
        placeEndsAt: null,
        voteEndsAt: Date.now() + VOTE_MS,
      },
    };

    emitState(io, room.code, room.state);
    reschedule(
      room,
      (room) => emitState(io, room.code, room.state),
      getTierSet
    );
  };
}

export function handleVote(io: IOServer, socket: IOSocket) {
  return ({ vote }: { vote: VoteValue }) => {
    const roomCode = [...socket.rooms].find((r) => r !== socket.id);
    if (!roomCode) return emitError(socket, "Not in a room.");
    const room = getRoom(roomCode);
    if (!room) return emitError(socket, "Room not found.");

    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, "Not a player.");
    if (room.state.phase !== "VOTE") return emitError(socket, "Not in VOTE.");
    if (room.state.currentTurnPlayerId === pid)
      return emitError(socket, "Placer cannot vote.");

    room.state = {
      ...room.state,
      votes: { ...room.state.votes, [pid]: vote },
    };

    const needed = Math.max(0, room.state.players.length - 1);
    const have = Object.keys(room.state.votes).length;

    if (have >= needed) {
      const now = Date.now();

      finalizeTurn(room);
      emitState(io, room.code, room.state);

      beginTurn(room, now);
      emitState(io, room.code, room.state);

      reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
      return;
    }

    emitState(io, room.code, room.state);
  };
}
