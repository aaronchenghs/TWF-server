import type { Room } from "../types/types.js";
import type { RoomPublicState, TierItemId } from "@twf/contracts";
import { getPhaseTimers } from "./timing.js";

export type DebugSnapshot = {
  at: number;
  state: RoomPublicState;
  itemQueue: TierItemId[];
};
/**
 * Rebuilds timers so the restored state behaves like the *start* of its phase.
 * This prevents an immediate auto-advance when restoring a snapshot.
 *
 * @param state Room public state being restored.
 * @param now   Current timestamp (ms).
 * @returns A timers object with only the active phase deadline set.
 */
export function resetTimersForPhase(
  state: RoomPublicState,
  now: number,
): RoomPublicState["timers"] {
  return getPhaseTimers(state.phase, now);
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

  const last = room.debugHistory[room.debugHistory.length - 1];
  if (
    last?.state.phase === room.state.phase &&
    last?.state.currentItem === room.state.currentItem
  ) {
    return;
  }

  room.debugHistory.push({
    at: Date.now(),
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
  now: number,
) {
  const isDebugMode = process.env.ENABLE_DEBUG_CONTROLS === "true";
  if (!isDebugMode) return;

  const history = room.debugHistory ?? [];
  const snapshot = history[snapShotIndex];
  if (!snapshot) return;

  room.state = structuredClone(snapshot.state);
  room.itemQueue = [...snapshot.itemQueue];

  room.state = {
    ...room.state,
    timers: resetTimersForPhase(room.state, now),
  };

  room.debugHistory = history.slice(0, snapShotIndex + 1);
}
