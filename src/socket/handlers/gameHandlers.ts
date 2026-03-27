/*
Copyright (C) 2026 Aaron Raphael Cheng

This file is part of Tiers! With Friends.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

See the LICENSE file for details.
*/

import { TierId, VoteValue } from "@twf/contracts";
import {
  beginResults,
  beginVote,
  passCurrentPlacementTurn,
  startGame,
  getEligibleVoterIds,
  getPlayerId,
  isItemPlaced,
} from "../../lib/game.js";
import { requireRoom, touchRoom } from "../../lib/rooms.js";
import { reschedule } from "../../lib/timing.js";
import { getTierSet } from "../../tierSets/registry.js";
import { emitError, emitRoomState, IOServer, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors.js";
import type { Room } from "../../types/types.js";
import { normalizeName } from "../../lib/general.js";

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
    if (room.state.players.length < 2)
      return emitError(socket, getErrorMessage("NOT_ENOUGH_PLAYERS"));
    if (room.state.players.some((player) => !normalizeName(player.name)))
      return emitError(socket, getErrorMessage("MISSING_PLAYER_NAMES"));

    const selectedTierSet = getTierSet(room.state.tierSetId);
    if (!selectedTierSet)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));

    // Once a new game starts, any deferred rematch players are considered gone.
    for (const sid of room.rematch.deferredClientIdBySocketId.keys()) {
      room.clientIdBySocketId.delete(sid);
    }
    room.rematch.deferredClientIdBySocketId.clear();
    room.rematch.deferredByClientId.clear();
    room.rematch.queuedPlayerIds.clear();
    room.rematch.hostStarted = false;

    startGame(room, selectedTierSet, Date.now());
    touchRoom(room);
    emitRoomState(io, room);
    reschedule(room, (r) => emitRoomState(io, r), getTierSet);
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

    beginVote(room, Date.now());
    touchRoom(room);
    emitRoomState(io, room);
    reschedule(room, (r) => emitRoomState(io, r), getTierSet);
  };
}

export function handlePassTurn(io: IOServer, socket: IOSocket) {
  return () => {
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

    passCurrentPlacementTurn(room, Date.now());
    touchRoom(room);
    emitRoomState(io, room);
    reschedule(room, (r) => emitRoomState(io, r), getTierSet);
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
    emitRoomState(io, room);
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
      beginResults(room, Date.now());
      touchRoom(room);
      emitRoomState(io, room);
      reschedule(room, (r) => emitRoomState(io, r), getTierSet);
      return;
    }

    touchRoom(room);
    emitRoomState(io, room);
  };
}

export function handleVoteUnlock(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    if (!room) return;
    const pid = getPlayerId(room, socket);
    if (!pid) return emitError(socket, getErrorMessage("NOT_A_PLAYER"));
    if (room.state.phase !== "VOTE")
      return emitError(socket, getErrorMessage("INVALID_PHASE"));
    if (room.state.currentTurnPlayerId === pid)
      return emitError(socket, getErrorMessage("PLACER_CANNOT_VOTE"));

    const confirmed = room.state.voteConfirmedByPlayerId ?? {};
    if (!confirmed[pid]) return;

    const nextVoteConfirmedByPlayerId = {
      ...confirmed,
    };
    delete nextVoteConfirmedByPlayerId[pid];

    room.state = {
      ...room.state,
      voteConfirmedByPlayerId: nextVoteConfirmedByPlayerId,
    };

    touchRoom(room);
    emitRoomState(io, room);
  };
}
