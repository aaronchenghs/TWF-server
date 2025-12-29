import type { TierSetId } from "@twf/contracts";
import { listTierSets, getTierSet } from "../../tierSets/registry.js";
import { emitError, IOSocket } from "../emit.js";
import { getErrorMessage } from "../../lib/errors.js";

export function handleTierSetsList(socket: IOSocket) {
  return () => {
    socket.emit("tierSets:listed", { tierSets: listTierSets() });
  };
}

export function handleTierSetsGet(socket: IOSocket) {
  return ({ id }: { id: TierSetId }) => {
    const tierSet = getTierSet(id);
    if (!tierSet)
      return emitError(socket, getErrorMessage("TIER_SET_NOT_FOUND"));
    socket.emit("tierSets:got", { tierSet });
  };
}
