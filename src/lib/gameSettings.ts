import type { RoomPublicState } from "@twf/contracts";

export const DEFAULT_GAME_SETTINGS: RoomPublicState["gameSettings"] = {
  unlimitedVotingTime: false,
  unlimitedPlacingTime: false,
};

export function sanitizeGameSettings(
  input: unknown,
): RoomPublicState["gameSettings"] {
  if (typeof input !== "object" || input === null)
    return { ...DEFAULT_GAME_SETTINGS };

  const candidate = input as Partial<
    Record<keyof RoomPublicState["gameSettings"], unknown>
  >;

  return {
    unlimitedVotingTime: candidate.unlimitedVotingTime === true,
    unlimitedPlacingTime: candidate.unlimitedPlacingTime === true,
  };
}
