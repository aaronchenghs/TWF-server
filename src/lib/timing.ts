import type {
  RoomCode,
  RoomPublicState,
  TierSetDefinition,
  TierSetId,
} from "@twf/contracts";
import type { Room } from "../types/types.js";
import {
  beginTurn,
  beginPlace,
  beginVote,
  finalizeTurn,
  beginResults,
  beginDrift,
  commitDriftResolution,
  fillMissingVotesAsAgree,
} from "./game.js";

export const BUILD_MS = 5_000;
export const REVEAL_MS = 2_000;
export const PLACE_MS = 15_000;
export const VOTE_MS = 60_000;
export const RESULTS_MS = 3_000;
export const DRIFT_MS = 1_000;

export const NULL_TIMERS: RoomPublicState["timers"] = {
  buildEndsAt: null,
  revealEndsAt: null,
  placeEndsAt: null,
  voteEndsAt: null,
  resultsEndsAt: null,
  driftEndsAt: null,
};

type EmitFn = (room: Room) => void;
type GetTierSetFn = (id: TierSetId) => TierSetDefinition | undefined;

const timersByRoom = new Map<RoomCode, NodeJS.Timeout[]>();

export function clearRoomTimers(roomCode: RoomCode) {
  const timers = timersByRoom.get(roomCode);
  if (!timers) return;
  for (const t of timers) clearTimeout(t);
  timersByRoom.delete(roomCode);
}

function addTimer(roomCode: RoomCode, t: NodeJS.Timeout) {
  const arr = timersByRoom.get(roomCode) ?? [];
  arr.push(t);
  timersByRoom.set(roomCode, arr);
}

/** reschedule: timer engine for game state */
export function reschedule(
  room: Room,
  emit: EmitFn,
  _getTierSet: GetTierSetFn
) {
  clearRoomTimers(room.code);
  const now = Date.now();
  const { phase, timers } = room.state;

  if (phase === "STARTING" && timers.buildEndsAt) {
    const dueAt = timers.buildEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        // Phase may have advanced early; guard against stale callback
        if (room.state.phase !== "STARTING") return;
        const now2 = Date.now();
        beginTurn(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }

  if (phase === "REVEAL" && timers.revealEndsAt) {
    const dueAt = timers.revealEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        if (room.state.phase !== "REVEAL") return;

        const now2 = Date.now();
        beginPlace(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }

  if (phase === "PLACE" && timers.placeEndsAt) {
    const dueAt = timers.placeEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        if (room.state.phase !== "PLACE") return;

        const now2 = Date.now();
        beginVote(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }

  if (phase === "VOTE" && timers.voteEndsAt) {
    const dueAt = timers.voteEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        if (room.state.phase !== "VOTE") return;

        const now2 = Date.now();
        fillMissingVotesAsAgree(room);
        beginResults(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }

  if (phase === "RESULTS" && timers.resultsEndsAt) {
    const dueAt = timers.resultsEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        if (room.state.phase !== "RESULTS") return;

        const now2 = Date.now();
        beginDrift(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }

  if (phase === "DRIFT" && timers.driftEndsAt) {
    const dueAt = timers.driftEndsAt;
    addTimer(
      room.code,
      setTimeout(() => {
        if (room.state.phase !== "DRIFT") return;
        const now2 = Date.now();
        commitDriftResolution(room);

        if (room.state.phase === "DRIFT") {
          try {
            finalizeTurn(room);
          } catch {
            // phase guards elsewhere will keep the engine moving
          }
        }

        emit(room);
        beginTurn(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, dueAt - now))
    );
    return;
  }
}
