import { TierId, VoteValue } from "@twf/contracts";
import {
  beginResults,
  beginVote,
  startGame,
  getEligibleVoterIds,
  getPlayerId,
  isItemPlaced,
} from "../../lib/game.js";
import { requireRoom, touchRoom } from "../../lib/rooms.js";
import { reschedule } from "../../lib/timing.js";
import { getTierSet } from "../../tierSets/registry.js";
import { emitError, emitState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors.js";
import type { Room } from "../../types/types.js";

function allEligibleVotersConfirmed(room: Room): boolean {
  const eligibleVoterIds = getEligibleVoterIds(room);
  if (eligibleVoterIds.length === 0) return true;
  const confirmed = room.state.voteConfirmedByPlayerId ?? {};
  return eligibleVoterIds.every((playerId) => confirmed[playerId]);
}

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

    const selectedTierSet = getTierSet(room.state.tierSetId);
    if (!selectedTierSet)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));

    if (room.state.players.length < 1)
      return emitError(socket, getErrorMessage("NOT_ENOUGH_PLAYERS"));

    // Once a new game starts, any deferred rematch players are considered gone.
    for (const sid of room.rematch.deferredClientIdBySocketId.keys()) {
      room.clientIdBySocketId.delete(sid);
    }
    room.rematch.deferredClientIdBySocketId.clear();
    room.rematch.deferredByClientId.clear();
    room.rematch.queuedPlayerIds.clear();
    room.rematch.hostStarted = false;

    touchRoom(room);
    startGame(room, selectedTierSet, Date.now());
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

    if (isItemPlaced(room, room.state.currentItem))
      return emitError(socket, getErrorMessage("ITEM_ALREADY_PLACED"));

    room.state = {
      ...room.state,
      pendingTierId: tierId,
      votes: {},
      voteConfirmedByPlayerId: {},
    };

    touchRoom(room);
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
    if (room.state.voteConfirmedByPlayerId?.[pid])
      return emitError(socket, getErrorMessage("VOTE_ALREADY_CONFIRMED"));

    room.state = {
      ...room.state,
      votes: { ...room.state.votes, [pid]: vote },
    };

    touchRoom(room);
    emitState(io, room.code, room.state);
  };
}

export function handleVoteConfirm(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;
    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));
    if (room.state.phase !== "VOTE")
      return emitError(socket, getErrorMessage("INVALID_PHASE"));
    if (room.state.currentTurnPlayerId === pid)
      return emitError(socket, getErrorMessage("PLACER_CANNOT_VOTE"));

    // If the player confirms without explicitly voting, treat it as an agree (0).
    const votesById = room.state.votes as Record<string, VoteValue | undefined>;
    const existingVote = votesById[pid];
    const nextVotes = { ...room.state.votes } as typeof room.state.votes;
    if (existingVote === undefined) nextVotes[pid] = 0 satisfies VoteValue;

    room.state = {
      ...room.state,
      votes: nextVotes,
      voteConfirmedByPlayerId: {
        ...(room.state.voteConfirmedByPlayerId ?? {}),
        [pid]: true,
      },
    };

    if (allEligibleVotersConfirmed(room)) {
      touchRoom(room);
      beginResults(room, Date.now());
      emitState(io, room.code, room.state);
      reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
      return;
    }

    touchRoom(room);
    emitState(io, room.code, room.state);
  };
}
