import { normalizeCircularIndex } from "./array.js";
import { beginPlace, getEligibleVoterIds } from "./game.js";
import { NULL_TIMERS } from "./timing.js";
import type { Room } from "../types/types.js";

export function shouldFinalizeVoteImmediately(room: Room): boolean {
  if (room.state.phase !== "VOTE") return false;

  const eligibleVoterIds = getEligibleVoterIds(room);
  const confirmed = room.state.voteConfirmedByPlayerId ?? {};
  const have = eligibleVoterIds.filter(
    (playerId) => confirmed[playerId],
  ).length;

  return have >= eligibleVoterIds.length;
}

export function shouldPermanentlyRemovePlayerOnDisconnect(
  reason: string,
): boolean {
  // Explicit client-side leave only.
  // Transport drops/timeouts remain resumable (e.g. mobile app backgrounding).
  return reason === "client namespace disconnect";
}

export function removePlayerFromTurnQueue(
  room: Room,
  playerId: string,
): { changed: boolean; requiresReschedule: boolean } {
  if (room.state.phase === "LOBBY" || room.state.phase === "FINISHED") {
    return { changed: false, requiresReschedule: false };
  }

  const currentQueue = room.state.turnOrderPlayerIds;
  const removedIndex = currentQueue.indexOf(playerId);
  if (removedIndex < 0) return { changed: false, requiresReschedule: false };

  const nextQueue = currentQueue.filter((id) => id !== playerId);
  const nextVotes = { ...room.state.votes };
  delete nextVotes[playerId];
  const nextVoteConfirmedByPlayerId = { ...room.state.voteConfirmedByPlayerId };
  delete nextVoteConfirmedByPlayerId[playerId];

  if (nextQueue.length === 0) {
    room.state = {
      ...room.state,
      phase: "FINISHED",
      turnOrderPlayerIds: [],
      turnIndex: 0,
      currentTurnPlayerId: null,
      currentItem: null,
      pendingTierId: null,
      votes: {},
      voteConfirmedByPlayerId: {},
      timers: NULL_TIMERS,
    };
    return { changed: true, requiresReschedule: true };
  }

  const normalizedTurnIndex = normalizeCircularIndex(
    room.state.turnIndex,
    currentQueue.length,
  );

  let nextTurnIndex = normalizedTurnIndex;
  if (removedIndex < normalizedTurnIndex) {
    nextTurnIndex = normalizedTurnIndex - 1;
  } else if (removedIndex === normalizedTurnIndex) {
    const wasCurrentTurnPlayer = room.state.currentTurnPlayerId === playerId;
    if (wasCurrentTurnPlayer && room.state.phase !== "PLACE") {
      // Keep progression stable for next-turn math during VOTE/RESULTS.
      nextTurnIndex = normalizeCircularIndex(
        removedIndex - 1,
        nextQueue.length,
      );
    } else {
      nextTurnIndex = removedIndex % nextQueue.length;
    }
  }

  const wasCurrentTurnPlayer = room.state.currentTurnPlayerId === playerId;
  const shouldAdvancePlaceTurnNow =
    wasCurrentTurnPlayer && room.state.phase === "PLACE";
  const nextCurrentTurnPlayerId = shouldAdvancePlaceTurnNow
    ? (nextQueue[nextTurnIndex] ?? null)
    : room.state.currentTurnPlayerId;

  room.state = {
    ...room.state,
    turnOrderPlayerIds: nextQueue,
    turnIndex: nextTurnIndex,
    currentTurnPlayerId: nextCurrentTurnPlayerId,
    pendingTierId: shouldAdvancePlaceTurnNow ? null : room.state.pendingTierId,
    votes: shouldAdvancePlaceTurnNow ? {} : nextVotes,
    voteConfirmedByPlayerId: shouldAdvancePlaceTurnNow
      ? {}
      : nextVoteConfirmedByPlayerId,
  };

  if (shouldAdvancePlaceTurnNow) {
    beginPlace(room, Date.now());
    return { changed: true, requiresReschedule: true };
  }

  return { changed: true, requiresReschedule: false };
}

export function removePlayerFromPublicState(
  room: Room,
  playerId: string,
): boolean {
  const nextPlayers = room.state.players.filter(
    (player) => player.id !== playerId,
  );
  if (nextPlayers.length === room.state.players.length) return false;

  const nextVotes = { ...room.state.votes };
  delete nextVotes[playerId];
  const nextVoteConfirmedByPlayerId = { ...room.state.voteConfirmedByPlayerId };
  delete nextVoteConfirmedByPlayerId[playerId];

  room.state = {
    ...room.state,
    players: nextPlayers,
    votes: nextVotes,
    voteConfirmedByPlayerId: nextVoteConfirmedByPlayerId,
  };
  return true;
}

export function removePlayerFromClientMap(room: Room, playerId: string): void {
  for (const [
    clientId,
    mappedPlayerId,
  ] of room.controllerByClientId.entries()) {
    if (mappedPlayerId !== playerId) continue;
    room.controllerByClientId.delete(clientId);
    break;
  }
}
