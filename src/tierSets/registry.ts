import type {
  TierSetDefinition,
  TierSetId,
  TierSetSummary,
} from "@twf/contracts";
import { videoGamesTierSet } from "./builtIns";

const BUILTINS: TierSetDefinition[] = [videoGamesTierSet];
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
