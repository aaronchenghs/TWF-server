import type { VoteValue, TierId, TurnResolution } from "@twf/contracts";

/**
 * computeResolution:
 * The math that determines the result of a voting round based on vote count and disagreements
 * @param args information required for computation
 * @returns deterministic results
 */
export function computeResolution(args: {
  votes: Record<string, VoteValue>;
  eligibleVoterIds: string[];
  fromTierId: TierId;
  tierOrder: TierId[];
}): { resolution: TurnResolution; driftDelta: number; toTierId: TierId } {
  const { votes, eligibleVoterIds, fromTierId, tierOrder } = args;

  let up = 0,
    down = 0,
    agree = 0;

  for (const pid of eligibleVoterIds) {
    const vote = votes[pid];
    if (vote === 1) up++;
    else if (vote === -1) down++;
    else if (vote === 0) agree++;
  }

  const eligible = eligibleVoterIds.length;
  const voters = up + down + agree;

  const scoreRaw = voters === 0 ? 0 : (up - down) / voters;
  const participation = eligible === 0 ? 0 : voters / eligible;
  const score = scoreRaw * participation;

  const abs = Math.abs(score);
  const magnitude = abs < 0.3 ? 0 : abs < 0.6 ? 1 : 2;
  const driftDelta = magnitude === 0 ? 0 : score > 0 ? magnitude : -magnitude;

  const safeTierOrder =
    tierOrder.length > 0 ? tierOrder : ([fromTierId] as TierId[]);

  const fromIdx = safeTierOrder.indexOf(fromTierId);
  const clampedFromIdx = fromIdx >= 0 ? fromIdx : 0;

  const toIdx = Math.min(
    safeTierOrder.length - 1,
    Math.max(0, clampedFromIdx + driftDelta)
  );

  const toTierId = safeTierOrder[toIdx] ?? fromTierId;

  const resolution: TurnResolution = {
    up,
    down,
    agree,
    voters,
    eligible,
    score,
    driftDelta,
    fromTierId,
    toTierId,
  };

  return { driftDelta, toTierId, resolution };
}
