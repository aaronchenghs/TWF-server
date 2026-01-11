import { IOServer, IOSocket, emitError, emitState } from "../emit.js";
import { requireRoom } from "../../lib/rooms";
import { getErrorMessage } from "../../lib/errors";
import { getTierSet } from "../../tierSets/registry.js";
import {
  beginTurn,
  beginPlace,
  beginVote,
  beginResults,
  beginDrift,
  commitDriftResolution,
  fillMissingVotesAsAgree,
  finalizeTurn,
} from "../../lib/game.js";
import { reschedule } from "../../lib/timing.js";
import { restoreToSnapshot } from "../../lib/debug.js";

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
      case "REVEAL": {
        beginPlace(room, now);
        break;
      }
      case "PLACE": {
        const tierIds = room.state.tierOrder;
        const randTier = tierIds[Math.floor(Math.random() * tierIds.length)];
        if (!randTier) return;

        room.state = { ...room.state, pendingTierId: randTier, votes: {} };
        beginVote(room, now);
        break;
      }
      case "VOTE": {
        fillMissingVotesAsAgree(room);
        beginResults(room, now);
        break;
      }
      case "RESULTS": {
        beginDrift(room, now);
        break;
      }
      case "DRIFT": {
        commitDriftResolution(room);
        try {
          finalizeTurn(room);
        } catch {}
        beginTurn(room, now);
        break;
      }
      case "RESOLVE": {
        beginTurn(room, now);
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

    console.log("debug:prev", {
      histLen: room.debugHistory.length,
      phase: room.state.phase,
    });

    if (room.debugHistory.length < 2) {
      return emitError(socket, "No previous phase snapshot yet.");
    }

    const now = Date.now();
    restoreToSnapshot(room, room.debugHistory.length - 2, now);

    emitState(io, room.code, room.state);
    reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
  };
}
