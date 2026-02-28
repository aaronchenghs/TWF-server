import {
  getRoom,
  findRoomBySocket,
  detachSocket,
  removeDeferredSocket,
  deleteRoomIfEmpty,
  getClientIdForPlayer,
  closeRoomAndDisconnect,
} from "../../lib/rooms.js";
import { beginResults } from "../../lib/game.js";
import { reschedule } from "../../lib/timing.js";
import { getTierSet } from "../../tierSets/registry.js";
import { IOServer, IOSocket, emitState } from "../emit.js";
import type { Guid } from "../../types/guid.js";
import {
  removePlayerFromTurnQueue,
  removePlayerFromPublicState,
  removePlayerFromClientMap,
  shouldFinalizeVoteImmediately,
  shouldPermanentlyRemovePlayerOnDisconnect,
} from "../../lib/playerDisconnection.js";

/**
 * Handles disconnection events.
 * - Player quits/close-tab remove that player from room state.
 * - If the current PLACE player leaves, turn advances immediately.
 * - If all active game players leave, the game is ended (FINISHED).
 * - Host disconnect in FINISHED (before rematch start) closes the room for all.
 * - Deferred rematch sockets are cleaned up even though they are not in socket.rooms.
 */
export function handleDisconnectFromRoom(io: IOServer, socket: IOSocket) {
  return (reason: string) => {
    for (const roomCode of socket.rooms) {
      if (roomCode === socket.id) continue;

      const room = getRoom(roomCode);
      if (!room) continue;
      const disconnectedPlayerId =
        room.controllerBySocketId.get(socket.id) ?? null;

      const wasHost = room.adminConnectionId === socket.id;
      if (
        wasHost &&
        room.state.phase === "FINISHED" &&
        !room.rematch.hostStarted
      ) {
        closeRoomAndDisconnect(io, room, socket.id);
        continue;
      }

      detachSocket(room, socket.id);

      let queueChanged = false;
      let queueNeedsReschedule = false;
      if (
        disconnectedPlayerId &&
        shouldPermanentlyRemovePlayerOnDisconnect(reason)
      ) {
        const disconnectedPlayer = room.state.players.find(
          (player) => player.id === disconnectedPlayerId,
        );
        const disconnectedClientId = getClientIdForPlayer(
          room,
          disconnectedPlayerId,
        );

        if (disconnectedPlayer && disconnectedClientId) {
          room.rematch.deferredByClientId.set(disconnectedClientId, {
            id: disconnectedPlayerId as Guid,
            name: disconnectedPlayer.name,
            avatar: disconnectedPlayer.avatar,
            joinedAt: disconnectedPlayer.joinedAt,
            clientId: disconnectedClientId,
            socketIds: new Set<string>(),
          });
        }

        const queueResult = removePlayerFromTurnQueue(
          room,
          disconnectedPlayerId,
        );
        const wasRemovedFromPlayers = removePlayerFromPublicState(
          room,
          disconnectedPlayerId,
        );
        removePlayerFromClientMap(room, disconnectedPlayerId);
        room.rematch.queuedPlayerIds.delete(disconnectedPlayerId as Guid);

        queueChanged = queueResult.changed || wasRemovedFromPlayers;
        queueNeedsReschedule = queueResult.requiresReschedule;
      }

      if (shouldFinalizeVoteImmediately(room)) {
        beginResults(room, Date.now());

        const deleted = deleteRoomIfEmpty(room);
        if (!deleted) {
          emitState(io, room.code, room.state);
          reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
        }
        continue;
      }

      const deleted = deleteRoomIfEmpty(room);
      if (!deleted) {
        emitState(io, room.code, room.state);
        if (queueChanged && queueNeedsReschedule) {
          reschedule(room, (r) => emitState(io, r.code, r.state), getTierSet);
        }
      }
    }

    // Deferred rematch sockets are intentionally removed from socket.io room membership.
    const deferredRoom = findRoomBySocket(socket.id);
    if (
      deferredRoom &&
      deferredRoom.rematch.deferredClientIdBySocketId.has(socket.id)
    ) {
      removeDeferredSocket(deferredRoom, socket.id);
    }
  };
}
