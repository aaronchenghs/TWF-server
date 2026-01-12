import { TierId, VoteValue } from "@twf/contracts";
import {
  beginResults,
  beginVote,
  fillMissingVotesAsAgree,
  gameStart,
  getPlayerId,
} from "../../lib/game";
import { requireRoom } from "../../lib/rooms";
import { reschedule } from "../../lib/timing";
import { getTierSet } from "../../tierSets/registry.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors";

export function handleStart(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;

    if (room.adminConnectionId !== socket.id)
      return emitError(socket, getErrorMessage("HOST_ACTION_FORBIDDEN"));
    if (room.state.phase !== "LOBBY")
      return emitError(socket, getErrorMessage("GAME_ALREADY_STARTED"));
    if (!room.state.tierSetId)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_SELECTED"));
    if (room.state.players.length < 1)
      return emitError(socket, getErrorMessage("NOT_ENOUGH_PLAYERS"));

    const selectedTierSet = getTierSet(room.state.tierSetId);
    if (!selectedTierSet)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));

    gameStart(room, selectedTierSet, Date.now());
    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}

export function handlePlaceItem(io: IOServer, socket: IOSocket) {
  return ({ tierId }: { tierId: TierId }) => {
    const room = requireRoom(socket);
    if (!room) return;

    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));
    if (room.state.phase !== "PLACE")
      return emitError(socket, getErrorMessage("INVALID_PHASE"));
    if (room.state.currentTurnPlayerId !== pid)
      return emitError(socket, getErrorMessage("NOT_YOUR_TURN"));
    if (!room.state.currentItem)
      return emitError(socket, getErrorMessage("NO_CURRENT_ITEM"));
    if (!room.state.tiers[tierId])
      return emitError(socket, getErrorMessage("INVALID_TIER"));

    const isAlreadyPlaced = Object.values(room.state.tiers).some((arr) =>
      arr.includes(room.state.currentItem!)
    );
    if (isAlreadyPlaced)
      return emitError(socket, getErrorMessage("ITEM_ALREADY_PLACED"));

    room.state = {
      ...room.state,
      pendingTierId: tierId,
      votes: {},
    };

    beginVote(room, Date.now());
    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}

export function handleVote(io: IOServer, socket: IOSocket) {
  return ({ vote }: { vote: VoteValue }) => {
    const room = requireRoom(socket);
    if (!room) return;
    if (vote !== -1 && vote !== 0 && vote !== 1)
      return emitError(socket, getErrorMessage("INVALID_VOTE"));
    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));
    if (room.state.phase !== "VOTE")
      return emitError(socket, getErrorMessage("INVALID_PHASE"));
    if (room.state.currentTurnPlayerId === pid)
      return emitError(socket, getErrorMessage("PLACER_CANNOT_VOTE"));

    room.state = {
      ...room.state,
      votes: { ...room.state.votes, [pid]: vote },
    };

    const needed = Math.max(0, room.state.players.length - 1);
    const have = Object.keys(room.state.votes).length;

    if (have >= needed) {
      const now = Date.now();
      fillMissingVotesAsAgree(room);
      beginResults(room, now);
      emitState(io, room.code, room.state);
      reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
      return;
    }

    emitState(io, room.code, room.state);
  };
}
