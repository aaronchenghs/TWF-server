import { IOServer, IOSocket, emitError, emitState } from "../emit.js";
import { requireRoom } from "../../lib/rooms.js";
import { getErrorMessage } from "../../lib/errors.js";
import { getTierSet } from "../../tierSets/registry.js";
import {
  beginTurn,
  beginVote,
  beginResults,
  commitDriftResolution,
  fillMissingVotesAsAgree,
} from "../../lib/game.js";
import { clearRoomTimers, NULL_TIMERS, reschedule } from "../../lib/timing.js";
import { resetTimersForPhase, restoreToSnapshot } from "../../lib/debug.js";

function devGuard(room: ReturnType<typeof requireRoom>, socket: IOSocket) {
  const isDebugMode = process.env.ENABLE_DEBUG_CONTROLS === "true";
  if (!isDebugMode) return getErrorMessage("NOT_DEBUG_MODE");
  if (!room) return getErrorMessage("NOT_IN_ROOM");
  if (room.adminConnectionId !== socket.id)
    return getErrorMessage("SOCKET_ID_MISMATCH");
  return null;
}

export function handleDebugNext(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    const err = devGuard(room, socket);
    if (err) return emitError(socket, err);
    if (!room) return;

    const now = Date.now();

    switch (room.state.phase) {
      case "STARTING": {
        beginTurn(room, now);
        break;
      }
      case "PLACE": {
        const tierIds = room.state.tierOrder;
        const randTier = tierIds[Math.floor(Math.random() * tierIds.length)];
        if (!randTier) return;

        room.state = {
          ...room.state,
          pendingTierId: randTier,
          votes: {},
          voteConfirmedByPlayerId: {},
        };
        beginVote(room, now);
        break;
      }
      case "VOTE": {
        fillMissingVotesAsAgree(room);
        beginResults(room, now);
        break;
      }
      case "RESULTS": {
        commitDriftResolution(room);
        beginTurn(room, now, 1);
        break;
      }
      case "RESOLVE": {
        beginTurn(room, now, 1);
        break;
      }
      default:
        return;
    }

    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}

export function handleDebugPrev(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    const err = devGuard(room, socket);
    if (err) return emitError(socket, err);
    if (!room) return;

    room.debugHistory ??= [];

    if (room.debugHistory.length < 2)
      return emitError(socket, getErrorMessage("NO_PREV_SNAPSHOT"));

    const now = Date.now();
    restoreToSnapshot(room, room.debugHistory.length - 2, now);

    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}

export function handleDebugTogglePause(io: IOServer, socket: IOSocket) {
  return () => {
    const room = requireRoom(socket);
    const err = devGuard(room, socket);
    if (err) return emitError(socket, err);
    if (!room) return;

    const paused = !(room.state.debug?.paused ?? false);

    room.state = {
      ...room.state,
      debug: {
        ...(room.state.debug ?? {}),
        paused,
      },
    };

    if (paused) {
      clearRoomTimers(room.code);
      room.state = {
        ...room.state,
        timers: { ...room.state.timers, ...NULL_TIMERS },
      };
    } else {
      // RESUMING: restart timers for the CURRENT phase
      const now = Date.now();
      room.state = {
        ...room.state,
        timers: resetTimersForPhase(room.state, now),
      };
    }

    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}
