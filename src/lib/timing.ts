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
  getNextTurn,
} from "./game.js";

export const PHASE_TIMERS = {
  BUILD_MS: 3_000,
  PLACE_MS: 20_000,
  VOTE_MS: 60_000,
  RESULTS_MS: 4_500,
  DRIFT_MS: 1_000,
} as const;

export const ONE_HOUR_MS = 1000 * 60 * 60;

export const NULL_TIMERS: RoomPublicState["timers"] = {
  buildEndsAt: null,
  placeEndsAt: null,
  voteEndsAt: null,
  resultsEndsAt: null,
  driftEndsAt: null,
};

const timersByRoom = new Map<RoomCode, NodeJS.Timeout[]>();

type EmitFn = (room: Room) => void;
type GetTierSetFn = (id: TierSetId) => TierSetDefinition | undefined;

export function getPhaseTimers(
  phase: RoomPublicState["phase"],
  now: number,
): RoomPublicState["timers"] {
  switch (phase) {
    case "STARTING":
      return { ...NULL_TIMERS, buildEndsAt: now + PHASE_TIMERS.BUILD_MS };
    case "PLACE":
      return { ...NULL_TIMERS, placeEndsAt: now + PHASE_TIMERS.PLACE_MS };
    case "VOTE":
      return { ...NULL_TIMERS, voteEndsAt: now + PHASE_TIMERS.VOTE_MS };
    case "RESULTS":
      return { ...NULL_TIMERS, resultsEndsAt: now + PHASE_TIMERS.RESULTS_MS };
    case "DRIFT":
      return { ...NULL_TIMERS, driftEndsAt: now + PHASE_TIMERS.DRIFT_MS };
    default:
      return NULL_TIMERS;
  }
}

function addTimer(roomCode: RoomCode, timer: NodeJS.Timeout) {
  const roomTimers = timersByRoom.get(roomCode) ?? [];
  roomTimers.push(timer);
  timersByRoom.set(roomCode, roomTimers);
}

export function clearRoomTimers(roomCode: RoomCode) {
  const timers = timersByRoom.get(roomCode);
  if (!timers) return;
  for (const t of timers) clearTimeout(t);
  timersByRoom.delete(roomCode);
}

/** reschedule: timer engine for game state */
export function reschedule(
  room: Room,
  emit: EmitFn,
  _getTierSet: GetTierSetFn,
) {
  clearRoomTimers(room.code);
  const now = Date.now();
  const { phase, timers } = room.state;

  if (phase === "STARTING" && timers.buildEndsAt) {
    const dueAt = timers.buildEndsAt;
    addTimer(
      room.code,
      setTimeout(
        () => {
          if (room.state.phase !== "STARTING") return;
          const now2 = Date.now();
          beginTurn(room, now2); // beginTurn now enters PLACE directly
          emit(room);
          reschedule(room, emit, _getTierSet);
        },
        Math.max(0, dueAt - now),
      ),
    );
    return;
  }

  if (phase === "PLACE" && timers.placeEndsAt) {
    const dueAt = timers.placeEndsAt;
    addTimer(
      room.code,
      setTimeout(
        () => {
          if (room.state.phase !== "PLACE") return;
          const now2 = Date.now();

          // If no tier has been selected by the placer (they timed out), skip their
          // turn and give the next player a chance to place the same item. Otherwise
          // proceed directly to voting.
          if (!room.state.pendingTierId) {
            const { turnIndex, currentTurnPlayerId } = getNextTurn(room, 1);
            room.state = {
              ...room.state,
              turnIndex,
              currentTurnPlayerId,
              pendingTierId: null,
              votes: {},
            };

            beginPlace(room, now2);
            emit(room);
            reschedule(room, emit, _getTierSet);
            return;
          }

          beginVote(room, now2);
          emit(room);
          reschedule(room, emit, _getTierSet);
        },
        Math.max(0, dueAt - now),
      ),
    );
    return;
  }

  if (phase === "VOTE" && timers.voteEndsAt) {
    const dueAt = timers.voteEndsAt;
    addTimer(
      room.code,
      setTimeout(
        () => {
          if (room.state.phase !== "VOTE") return;
          const now2 = Date.now();
          beginResults(room, now2);
          emit(room);
          reschedule(room, emit, _getTierSet);
        },
        Math.max(0, dueAt - now),
      ),
    );
    return;
  }

  if (phase === "RESULTS" && timers.resultsEndsAt) {
    const dueAt = timers.resultsEndsAt;
    addTimer(
      room.code,
      setTimeout(
        () => {
          if (room.state.phase !== "RESULTS") return;
          const now2 = Date.now();
          beginDrift(room, now2);
          emit(room);
          reschedule(room, emit, _getTierSet);
        },
        Math.max(0, dueAt - now),
      ),
    );
    return;
  }

  if (phase === "DRIFT" && timers.driftEndsAt) {
    const dueAt = timers.driftEndsAt;
    addTimer(
      room.code,
      setTimeout(
        () => {
          if (room.state.phase !== "DRIFT") return;
          const now2 = Date.now();
          commitDriftResolution(room);

          if (room.state.phase === "DRIFT") {
            try {
              finalizeTurn(room);
            } catch {}
          }

          emit(room);
          beginTurn(room, now2);
          emit(room);
          reschedule(room, emit, _getTierSet);
        },
        Math.max(0, dueAt - now),
      ),
    );
    return;
  }
}
