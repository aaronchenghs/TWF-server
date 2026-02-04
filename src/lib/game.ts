import type {
  Tier,
  TierId,
  TierItem,
  TierItemId,
  TierSetDefinition,
  VoteValue,
} from "@twf/contracts";
import type { Room } from "../types/types.js";
import { NULL_TIMERS, PHASE_TIMERS } from "./timing.js";
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

export function getNextTurn(
  room: Room,
  delta = 1,
): {
  turnIndex: number;
  currentTurnPlayerId: (typeof room.state.turnOrderPlayerIds)[number] | null;
} {
  const ids = room.state.turnOrderPlayerIds;
  const playersLength = ids.length;
  if (playersLength <= 0) return { turnIndex: 0, currentTurnPlayerId: null };

  const turnIndex = (room.state.turnIndex + delta) % playersLength;
  const currentTurnPlayerId = ids[turnIndex] ?? null;
  return { turnIndex, currentTurnPlayerId };
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
      buildEndsAt: now + PHASE_TIMERS.BUILD_MS,
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

  const { currentTurnPlayerId } = getNextTurn(room, 0);

  room.state = {
    ...room.state,
    phase: "PLACE",
    currentItem: nextItem,
    pendingTierId: null,
    votes: {},
    currentTurnPlayerId,
    timers: {
      ...NULL_TIMERS,
      ...room.state.timers,
      placeEndsAt: now + PHASE_TIMERS.PLACE_MS,
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
      placeEndsAt: now + PHASE_TIMERS.PLACE_MS,
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
      voteEndsAt: now + PHASE_TIMERS.VOTE_MS,
    },
  };
  recordPhaseStart(room);
}

export function finalizeTurn(room: Room) {
  if (room.state.phase !== "VOTE" && room.state.phase !== "DRIFT")
    throw new Error(getErrorMessage("FINALIZE_OUTSIDE_VOTE"));
  const { turnIndex } = getNextTurn(room, 1);
  room.state = {
    ...room.state,
    phase: "RESOLVE",
    currentItem: null,
    currentTurnPlayerId: null,
    votes: {},
    turnIndex,
    timers: {
      ...room.state.timers,
      voteEndsAt: null,
    },
  };
}

export function beginResults(room: Room, now: number) {
  const { currentItem, pendingTierId, currentTurnPlayerId, votes, players } =
    room.state;
  if (!currentItem) throw new Error(getErrorMessage("NO_CURRENT_ITEM"));
  if (!pendingTierId) throw new Error(getErrorMessage("MISSING_PENDING_TIER"));

  const placerId = currentTurnPlayerId;
  const eligibleVoters = players
    .map((p) => p.id)
    .filter((id) => id !== placerId);
  const actualVoters = Object.keys(votes).filter((id) =>
    eligibleVoters.includes(id),
  );
  const didNobodyVote = actualVoters.length === 0;

  // Policy:
  // - If nobody voted, pretend everyone agreed (0).
  // - If some voted, only those votes count toward drift.
  const votersToCount = didNobodyVote ? eligibleVoters : actualVoters;

  if (didNobodyVote) for (const id of eligibleVoters) votes[id] = 0;

  const { resolution } = computeResolution({
    votes,
    eligibleVoterIds: votersToCount,
    fromTierId: pendingTierId,
    tierOrder: room.state.tierOrder,
  });

  room.state = {
    ...room.state,
    phase: "RESULTS",
    lastResolution: resolution,
    timers: {
      ...room.state.timers,
      voteEndsAt: null,
      resultsEndsAt: now + PHASE_TIMERS.RESULTS_MS,
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

  const toTierId = res.toTierId;

  if (!room.state.tiers[toTierId])
    throw new Error(getErrorMessage("INVALID_TIER"));

  room.state = {
    ...room.state,
    phase: "DRIFT",
    timers: {
      ...room.state.timers,
      resultsEndsAt: null,
      driftEndsAt: now + PHASE_TIMERS.DRIFT_MS,
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
      (x) => x !== item,
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
