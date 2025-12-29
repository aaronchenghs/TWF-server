import type { RoomCode, TierSetDefinition, TierSetId } from "@twf/contracts";
import type { Room } from "../types/types.js";
import {
  beginTurn,
  beginPlace,
  beginVote,
  finalizeTurn,
  beginResults,
  beginDrift,
  commitDriftResolution,
} from "./game.js";

export const BUILD_MS = 1500;
export const REVEAL_MS = 1200;
export const PLACE_MS = 12_000;
export const VOTE_MS = 8_000;
export const RESULTS_MS = 1500;
export const DRIFT_MS = 900;

type EmitFn = (room: Room) => void;
type GetTierSetFn = (id: TierSetId) => TierSetDefinition | undefined;

const timersByRoom = new Map<RoomCode, NodeJS.Timeout[]>();

function clearRoomTimers(roomCode: RoomCode) {
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
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();
        beginTurn(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.buildEndsAt - now))
    );
    return;
  }

  if (phase === "REVEAL" && timers.revealEndsAt) {
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();
        beginPlace(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.revealEndsAt - now))
    );
    return;
  }

  if (phase === "PLACE" && timers.placeEndsAt) {
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();
        beginVote(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.placeEndsAt - now))
    );
    return;
  }

  if (phase === "VOTE" && timers.voteEndsAt) {
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();
        beginResults(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.voteEndsAt - now))
    );
    return;
  }

  if (phase === "RESULTS" && timers.resultsEndsAt) {
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();
        beginDrift(room, now2);
        emit(room);
        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.resultsEndsAt - now))
    );
    return;
  }

  if (phase === "DRIFT" && timers.driftEndsAt) {
    addTimer(
      room.code,
      setTimeout(() => {
        const now2 = Date.now();

        commitDriftResolution(room);
        finalizeTurn(room);
        emit(room);

        beginTurn(room, now2);
        emit(room);

        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.driftEndsAt - now))
    );
    return;
  }
}
