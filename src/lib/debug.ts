import type { Room } from "../types/types.js";
import type { RoomPublicState } from "@twf/contracts";
import {
  BUILD_MS,
  REVEAL_MS,
  PLACE_MS,
  VOTE_MS,
  RESULTS_MS,
  DRIFT_MS,
  NULL_TIMERS,
} from "./timing.js";

/**
 * Rebuilds timers so the restored state behaves like the *start* of its phase.
 * This prevents an immediate auto-advance when restoring a snapshot.
 *
 * @param state Room public state being restored.
 * @param now   Current timestamp (ms).
 * @returns A timers object with only the active phase deadline set.
 */
function resetTimersForPhase(
  state: RoomPublicState,
  now: number
): RoomPublicState["timers"] {
  switch (state.phase) {
    case "STARTING":
      return { ...NULL_TIMERS, buildEndsAt: now + BUILD_MS };
    case "REVEAL":
      return { ...NULL_TIMERS, revealEndsAt: now + REVEAL_MS };
    case "PLACE":
      return { ...NULL_TIMERS, placeEndsAt: now + PLACE_MS };
    case "VOTE":
      return { ...NULL_TIMERS, voteEndsAt: now + VOTE_MS };
    case "RESULTS":
      return { ...NULL_TIMERS, resultsEndsAt: now + RESULTS_MS };
    case "DRIFT":
      return { ...NULL_TIMERS, driftEndsAt: now + DRIFT_MS };
    default:
      return NULL_TIMERS;
  }
}

/**
 * Records a snapshot of the room at the beginning of a phase (debug mode only).
 * Used by the "Prev" debug button to restore earlier phase-start states.
 *
 * Notes:
 * - No-op unless ENABLE_DEBUG_CONTROLS === "true".
 * - Dedupes consecutive snapshots for the same phase/currentItem.
 *
 * @param room The room to snapshot.
 */
export function recordPhaseStart(room: Room) {
  const isDebugMode = process.env.ENABLE_DEBUG_CONTROLS === "true";
  if (!isDebugMode) return;
  room.debugHistory ??= [];

  // avoid stacking duplicates of same phase start
  const last = room.debugHistory[room.debugHistory.length - 1];
  if (
    last?.state.phase === room.state.phase &&
    last?.state.currentItem === room.state.currentItem
  )
    return;

  room.debugHistory.push({
    state: structuredClone(room.state),
    itemQueue: [...room.itemQueue],
  });
}

/**
 * Restores the room to a previously recorded phase-start snapshot (debug mode only).
 * Resets timers to the beginning of that phase and trims history to the restored point.
 *
 * @param room      The room to mutate.
 * @param snapShotIndex Index into room.debugHistory to restore.
 * @param now       Current timestamp (ms), used to rebuild timers.
 */
export function restoreToSnapshot(
  room: Room,
  snapShotIndex: number,
  now: number
) {
  const isDebugMode = process.env.ENABLE_DEBUG_CONTROLS === "true";
  if (!isDebugMode) return;
  const history = room.debugHistory ?? [];
  const snapshot = history[snapShotIndex];
  if (!snapshot) return;

  room.state = structuredClone(snapshot.state);
  room.itemQueue = [...snapshot.itemQueue];

  // make it the *beginning* of that phase now (prevents instant auto-advance)
  room.state = {
    ...room.state,
    timers: resetTimersForPhase(room.state, now),
  };

  room.debugHistory = history.slice(0, snapShotIndex + 1);
}
