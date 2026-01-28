import type {
  TierSetDefinition,
  TierSetId,
  TierSetSummary,
} from "@twf/contracts";
import { TIERSET_PRESETS } from "./builtIns";

const BUILTINS: TierSetDefinition[] = TIERSET_PRESETS;
const byId = new Map<TierSetId, TierSetDefinition>(
  BUILTINS.map((s) => [s.id, s]),
);

export function listTierSets(): TierSetSummary[] {
  return BUILTINS.map((s) => ({
    ...s,
  }));
}

export function getTierSet(id: TierSetId): TierSetDefinition | undefined {
  return byId.get(id);
}
