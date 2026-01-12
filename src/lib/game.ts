import type {
  Tier,
  TierId,
  TierItem,
  TierItemId,
  TierSetDefinition,
  VoteValue,
} from "@twf/contracts";
import type { Room } from "../types/types.js";
import { NULL_TIMERS, TIMERS } from "./timing.js";
import { shuffle } from "lodash-es";
import { IOSocket } from "../socket/emit.js";
import { getErrorMessage } from "./errors.js";
import { computeResolution } from "./computations.js";
import { recordPhaseStart } from "./debug.js";

function getItemIds(tierSet: TierSetDefinition): TierItemId[] {
  const items = tierSet.items ?? [];
  return items
    .map((item) => item?.id)
    .filter((id): id is TierItemId => typeof id === "string" && id.length > 0);
}

export function fillMissingVotesAsAgree(room: Room) {
  const placerId = room.state.currentTurnPlayerId;
  if (!placerId) return;
  for (const p of room.state.players) {
    if (p.id === placerId) continue;
    if (room.state.votes[p.id] === undefined) {
      room.state.votes[p.id] = 0 satisfies VoteValue;
    }
  }
}

function isItemPlaced(room: Room, itemId: TierItemId): boolean {
  return Object.values(room.state.tiers).some((arr) => arr.includes(itemId));
}

function popNextUnplacedItem(room: Room): TierItemId | null {
  while (room.itemQueue.length > 0) {
    const next = room.itemQueue.shift()!;
    if (!isItemPlaced(room, next)) return next;
  }
  return null;
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

  const tiersMeta: Record<TierId, Tier> = {};
  for (const tier of tierSet.tiers) tiersMeta[tier.id] = tier;
  const itemMetaById: Record<TierItemId, TierItem> = {};
  for (const item of tierSet.items ?? []) itemMetaById[item.id] = item;

  room.state = {
    ...room.state,
    phase: "STARTING",
    turnOrderPlayerIds: shuffle(playerIds),
    turnIndex: 0,
    tierMetaById: tiersMeta,
    itemMetaById,
    currentTurnPlayerId: null,
    currentItem: null,
    votes: {},
    timers: {
      ...NULL_TIMERS,
      ...room.state.timers,
      buildEndsAt: now + TIMERS.BUILD_MS,
    },
  };

  recordPhaseStart(room);
}

// #region direct socket helpers

export function beginTurn(room: Room, now: number) {
  const nextItem = popNextUnplacedItem(room);

  if (!nextItem) {
    room.state = {
      ...room.state,
      phase: "FINISHED",
      currentItem: null,
      pendingTierId: null,
      votes: {},
      timers: {
        ...NULL_TIMERS,
        ...room.state.timers,
      },
    };
    return;
  }

  const turnIndex = room.state.turnIndex;
  const currentTurnPlayerId =
    room.state.turnOrderPlayerIds.length > 0
      ? room.state.turnOrderPlayerIds[
          turnIndex % room.state.turnOrderPlayerIds.length
        ] ?? null
      : null;

  room.state = {
    ...room.state,
    phase: "REVEAL",
    currentItem: nextItem,
    pendingTierId: null,
    votes: {},
    currentTurnPlayerId,
    timers: {
      ...NULL_TIMERS,
      ...room.state.timers,
      revealEndsAt: now + TIMERS.REVEAL_MS,
    },
  };
  recordPhaseStart(room);
}

export function beginPlace(room: Room, now: number) {
  room.state = {
    ...room.state,
    phase: "PLACE",
    timers: {
      ...room.state.timers,
      revealEndsAt: null,
      placeEndsAt: now + TIMERS.PLACE_MS,
    },
  };
  recordPhaseStart(room);
}

export function beginVote(room: Room, now: number) {
  room.state = {
    ...room.state,
    phase: "VOTE",
    timers: {
      ...room.state.timers,
      placeEndsAt: null,
      voteEndsAt: now + TIMERS.VOTE_MS,
    },
  };
  recordPhaseStart(room);
}

export function finalizeTurn(room: Room) {
  if (room.state.phase !== "VOTE" && room.state.phase !== "DRIFT")
    throw new Error(getErrorMessage("FINALIZE_OUTSIDE_VOTE"));

  const playersCount = room.state.turnOrderPlayerIds.length;

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
      resultsEndsAt: now + TIMERS.RESULTS_MS,
      driftEndsAt: null,
    },
  };
  recordPhaseStart(room);
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
      driftEndsAt: now + TIMERS.DRIFT_MS,
    },
  };
  recordPhaseStart(room);
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

// #endregion direct socket helpers
