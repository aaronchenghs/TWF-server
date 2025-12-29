import type { TierItemId, TierSetDefinition } from "@twf/contracts";
import type { Room } from "../types/types.js";
import { BUILD_MS, REVEAL_MS, PLACE_MS, VOTE_MS } from "./timers.js";
import { shuffle } from "lodash-es";
import { IOSocket } from "../socket/emit.js";

function getItemIds(tierSet: TierSetDefinition): TierItemId[] {
  const items = tierSet.items;
  if (!Array.isArray(items)) return [];
  return items.filter((x) => typeof x === "string") as TierItemId[];
}

export function getPlayerId(room: Room, socket: IOSocket) {
  return room.controllerBySocketId.get(socket.id) ?? null;
}

export function gameStart(room: Room, tierSet: TierSetDefinition, now: number) {
  const playerIds = room.state.players.map((player) => player.id);
  if (playerIds.length < 1) throw new Error("No players.");

  const items = getItemIds(tierSet);
  if (items.length < 1) throw new Error("Tier set has no items.");
  room.itemQueue = shuffle(items);

  room.state = {
    ...room.state,
    phase: "STARTING",
    turnOrderPlayerIds: shuffle(playerIds),
    turnIndex: 0,
    currentTurnPlayerId: null,
    currentItem: null,
    votes: {},
    timers: {
      ...room.state.timers,
      buildEndsAt: now + BUILD_MS,
      revealEndsAt: null,
      placeEndsAt: null,
      voteEndsAt: null,
    },
  };
}

export function beginTurn(room: Room, now: number) {
  const queue = room.itemQueue;
  const item = queue?.[0] ?? null;

  if (!item) {
    room.state = {
      ...room.state,
      phase: "FINISHED",
      currentItem: null,
      currentTurnPlayerId: null,
      votes: {},
      timers: {
        ...room.state.timers,
        buildEndsAt: null,
        revealEndsAt: null,
        placeEndsAt: null,
        voteEndsAt: null,
      },
    };
    return;
  }

  const currentPlayerId =
    room.state.turnOrderPlayerIds[room.state.turnIndex] ?? null;

  room.state = {
    ...room.state,
    phase: "REVEAL",
    currentItem: item,
    currentTurnPlayerId: currentPlayerId,
    votes: {},
    timers: {
      ...room.state.timers,
      buildEndsAt: null,
      revealEndsAt: now + REVEAL_MS,
      placeEndsAt: null,
      voteEndsAt: null,
    },
  };
}

export function beginPlace(room: Room, now: number) {
  room.state = {
    ...room.state,
    phase: "PLACE",
    timers: {
      ...room.state.timers,
      revealEndsAt: null,
      placeEndsAt: now + PLACE_MS,
    },
  };
}

export function beginVote(room: Room, now: number) {
  room.state = {
    ...room.state,
    phase: "VOTE",
    timers: {
      ...room.state.timers,
      placeEndsAt: null,
      voteEndsAt: now + VOTE_MS,
    },
  };
}

export function finalizeTurn(room: Room) {
  if (room.state.phase !== "VOTE")
    throw new Error("Cannot finalize outside VOTE.");

  const playersCount = room.state.turnOrderPlayerIds.length;
  if (room.itemQueue.length > 0) room.itemQueue.shift();

  room.state = {
    ...room.state,
    phase: "RESOLVE",
    currentItem: null,
    currentTurnPlayerId: null,
    votes: {},
    turnIndex: playersCount > 0 ? (room.state.turnIndex + 1) % playersCount : 0,
    timers: {
      ...room.state.timers,
      voteEndsAt: null,
    },
  };
}
