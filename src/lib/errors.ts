const ERRORS = {
  ROOM_NOT_FOUND: "Room not found.",
  NOT_IN_ROOM: "Not in a room.",
  NO_PLAYERS: "No players.",
  HOST_ACTION_FORBIDDEN: "Only host can perform this action.",
  GAME_ALREADY_STARTED: "Game already started.",
  TIER_SET_NOT_SELECTED: "Select a tier set first.",
  TIER_SET_NOT_FOUND: "Unknown tier set.",
  NOT_ENOUGH_PLAYERS: "Need at least one player.",
  NAME_REQUIRED: "Name required.",
  TIER_SET_HAS_NO_ITEMS: "Tier set has no items.",
  NO_CURRENT_ITEM: "No current item.",
  INVALID_TIER: "Invalid tier.",
  ITEM_ALREADY_PLACED: "Item already placed.",
  NOT_A_PLAYER: "Not a player.",
  NOT_YOUR_TURN: "Not your turn.",
  INVALID_PHASE: "Not allowed in the current game phase.",
  PLACER_CANNOT_VOTE: "Placer cannot vote.",
  JOIN_FAILED: "Join failed.",
  FINALIZE_OUTSIDE_VOTE: "Cannot finalize outside VOTE.",
  CANNOT_CHANGE_TIER_SET: "Cannot change tier set after start.",
  CANNOT_FINALIZE_OUTSIDE_VOTE: "Cannot finalize outside VOTE.",
} as const;

export type ErrorKey = keyof typeof ERRORS;

export function getErrorMessage(key: ErrorKey): string {
  return ERRORS[key];
}
