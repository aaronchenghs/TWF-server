import type {
  TierSetDefinition,
  TierSetId,
  TierSetSummary,
} from "@twf/contracts";
import {
  FAST_FOOD_TIERSET,
  GYM_LIFTS_TIERSET,
  VIDEO_GAMES_TIERSET,
} from "./builtIns";

const BUILTINS: TierSetDefinition[] = [
  VIDEO_GAMES_TIERSET,
  FAST_FOOD_TIERSET,
  GYM_LIFTS_TIERSET,
];
const byId = new Map<TierSetId, TierSetDefinition>(
  BUILTINS.map((s) => [s.id, s])
);

export function listTierSets(): TierSetSummary[] {
  return BUILTINS.map((s) => ({
    ...s,
  }));
}

export function getTierSet(id: TierSetId): TierSetDefinition | undefined {
  return byId.get(id);
}
