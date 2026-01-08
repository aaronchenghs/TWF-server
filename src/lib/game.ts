import type { TierId, TierItemId, TierSetDefinition } from "@twf/contracts";
import type { Room } from "../types/types.js";
import {
  BUILD_MS,
  REVEAL_MS,
  PLACE_MS,
  VOTE_MS,
  RESULTS_MS,
  DRIFT_MS,
} from "./timing.js";
import { shuffle } from "lodash-es";
import { IOSocket } from "../socket/emit.js";
import { getErrorMessage } from "./errors.js";
import { computeResolution } from "./computations.js";

function getItemIds(tierSet: TierSetDefinition): TierItemId[] {
  const items = tierSet.items;
  if (!Array.isArray(items)) return [];

  const asObjects = items as Array<{ id?: unknown }>;
  const ids = asObjects
    .map((x) => (typeof x?.id === "string" ? x.id : null))
    .filter((x): x is TierItemId => !!x);
  if (ids.length > 0) return ids;

  return items.filter((x) => typeof x === "string") as TierItemId[];
}

export function getPlayerId(room: Room, socket: IOSocket) {
  return room.controllerBySocketId.get(socket.id) ?? null;
}

export function gameStart(room: Room, tierSet: TierSetDefinition, now: number) {
  const playerIds = room.state.players.map((player) => player.id);
  if (playerIds.length < 1) throw new Error(getErrorMessage("NO_PLAYERS"));

  const items = getItemIds(tierSet);
  if (items.length < 1)
    throw new Error(getErrorMessage("TIER_SET_HAS_NO_ITEMS"));
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
      pendingTierId: null,
      lastResolution: null,
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
    throw new Error(getErrorMessage("FINALIZE_OUTSIDE_VOTE"));

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

export function beginResults(room: Room, now: number) {
  if (!room.state.currentItem)
    throw new Error(getErrorMessage("NO_CURRENT_ITEM"));
  if (!room.state.pendingTierId)
    throw new Error(getErrorMessage("MISSING_PENDING_TIER"));

  const eligibleVoterIds = room.state.players
    .map((p) => p.id)
    .filter((id) => id !== room.state.currentTurnPlayerId);

  const { resolution } = computeResolution({
    votes: room.state.votes,
    eligibleVoterIds,
    fromTierId: room.state.pendingTierId,
    tierOrder: room.state.tierOrder,
  });

  room.state = {
    ...room.state,
    phase: "RESULTS",
    lastResolution: resolution,
    timers: {
      ...room.state.timers,
      voteEndsAt: null,
      resultsEndsAt: now + RESULTS_MS,
      driftEndsAt: null,
    },
  };
}

export function beginDrift(room: Room, now: number) {
  const res = room.state.lastResolution;
  if (!res) throw new Error(getErrorMessage("MISSING_RESOLUTION"));
  if (!room.state.currentItem)
    throw new Error(getErrorMessage("NO_CURRENT_ITEM"));
  if (!room.state.pendingTierId)
    throw new Error(getErrorMessage("MISSING_PENDING_TIER"));

  const toTierId = res.toTierId as TierId;

  if (!room.state.tiers[toTierId])
    throw new Error(getErrorMessage("INVALID_TIER"));

  room.state = {
    ...room.state,
    phase: "DRIFT",
    timers: {
      ...room.state.timers,
      resultsEndsAt: null,
      driftEndsAt: now + DRIFT_MS,
    },
  };
}

export function commitDriftResolution(room: Room) {
  const item = room.state.currentItem;
  if (!item) throw new Error(getErrorMessage("NO_CURRENT_ITEM"));
  const res = room.state.lastResolution;
  if (!res) throw new Error(getErrorMessage("MISSING_RESOLUTION"));
  const toTierId = res.toTierId;
  const toTier = room.state.tiers[toTierId];
  if (!toTier) throw new Error(getErrorMessage("INVALID_TIER"));

  const nextTiers: typeof room.state.tiers = {};
  for (const [tierId, arr] of Object.entries(room.state.tiers)) {
    nextTiers[tierId as keyof typeof room.state.tiers] = arr.filter(
      (x) => x !== item
    );
  }

  nextTiers[toTierId] = [...toTier, item];

  room.state = {
    ...room.state,
    tiers: nextTiers,
    pendingTierId: null,
    lastResolution: null,
  };
}
