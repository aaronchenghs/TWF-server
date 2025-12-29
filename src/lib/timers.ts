import type { RoomCode, TierSetDefinition, TierSetId } from "@twf/contracts";
import type { Room } from "../types/types.js";
import { beginTurn, beginPlace, beginVote, finalizeTurn } from "../lib/game.js";

export const BUILD_MS = 1500;
export const REVEAL_MS = 1200;
export const PLACE_MS = 12_000;
export const VOTE_MS = 8_000;

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
        beginTurn(room, Date.now());
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
        beginPlace(room, Date.now());
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
        // No placement submitted by deadline: skip voting and advance to vote/resolve later.
        // MVP: go to VOTE anyway with empty votes (clients can still vote), or you can auto-place.
        beginVote(room, Date.now());
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

        finalizeTurn(room);
        emit(room);

        beginTurn(room, now2);
        emit(room);

        reschedule(room, emit, _getTierSet);
      }, Math.max(0, timers.voteEndsAt - now))
    );
  }
}
