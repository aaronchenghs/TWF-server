import type { RoomPublicState } from "@twf/contracts";

const PLACING_TIME_LIMIT_OPTIONS = [20, 30, 45, null] as const;
type PlacingTimeLimitSeconds = (typeof PLACING_TIME_LIMIT_OPTIONS)[number];

const VOTING_TIME_LIMIT_OPTIONS = [45, 60, 120, null] as const;
type VotingTimeLimitSeconds = (typeof VOTING_TIME_LIMIT_OPTIONS)[number];

const DEFAULT_PLACING_TIME_LIMIT_SECONDS: Exclude<
  PlacingTimeLimitSeconds,
  null
> = 30;
const DEFAULT_VOTING_TIME_LIMIT_SECONDS: Exclude<VotingTimeLimitSeconds, null> =
  60;

export const DEFAULT_GAME_SETTINGS: RoomPublicState["gameSettings"] = {
  placingTimeLimitSeconds: DEFAULT_PLACING_TIME_LIMIT_SECONDS,
  votingTimeLimitSeconds: DEFAULT_VOTING_TIME_LIMIT_SECONDS,
  unlimitedVotingTime: false,
  unlimitedPlacingTime: false,
};

function isPlacingTimeLimitSeconds(
  value: unknown,
): value is PlacingTimeLimitSeconds {
  return PLACING_TIME_LIMIT_OPTIONS.some((option) => option === value);
}

function isVotingTimeLimitSeconds(
  value: unknown,
): value is VotingTimeLimitSeconds {
  return VOTING_TIME_LIMIT_OPTIONS.some((option) => option === value);
}

function normalizePlacingTimeLimitSeconds(
  candidate: Record<string, unknown>,
): PlacingTimeLimitSeconds {
  if (isPlacingTimeLimitSeconds(candidate.placingTimeLimitSeconds))
    return candidate.placingTimeLimitSeconds;

  return candidate.unlimitedPlacingTime === true
    ? null
    : DEFAULT_PLACING_TIME_LIMIT_SECONDS;
}

function normalizeVotingTimeLimitSeconds(
  candidate: Record<string, unknown>,
): VotingTimeLimitSeconds {
  if (isVotingTimeLimitSeconds(candidate.votingTimeLimitSeconds))
    return candidate.votingTimeLimitSeconds;

  return candidate.unlimitedVotingTime === true
    ? null
    : DEFAULT_VOTING_TIME_LIMIT_SECONDS;
}

export function sanitizeGameSettings(
  input: unknown,
): RoomPublicState["gameSettings"] {
  if (typeof input !== "object" || input === null)
    return { ...DEFAULT_GAME_SETTINGS };

  const candidate = input as Record<string, unknown>;
  const placingTimeLimitSeconds = normalizePlacingTimeLimitSeconds(candidate);
  const votingTimeLimitSeconds = normalizeVotingTimeLimitSeconds(candidate);

  return {
    placingTimeLimitSeconds,
    votingTimeLimitSeconds,
    unlimitedVotingTime: votingTimeLimitSeconds === null,
    unlimitedPlacingTime: placingTimeLimitSeconds === null,
  };
}
