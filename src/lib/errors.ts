const ERRORS = {
  CANNOT_CHANGE_TIER_SET: "Cannot change tier set after start.",
  CANNOT_FINALIZE_OUTSIDE_VOTE: "Cannot finalize outside VOTE.",
  FINALIZE_OUTSIDE_VOTE: "Cannot finalize outside VOTE.",
  GAME_ALREADY_STARTED: "Game already started.",
  HOST_ACTION_FORBIDDEN: "Only host can perform this action.",
  INVALID_PHASE: "Not allowed in the current game phase.",
  INVALID_TIER: "Invalid tier.",
  INVALID_VOTE: "Invalid vote value.",
  ITEM_ALREADY_PLACED: "Item already placed.",
  JOIN_FAILED: "Join failed.",
  LOBBY_LIMIT_EXCEEDED: "Lobby player limit exceeded.",
  LOBBY_NOT_FOUND: "Lobby not found.",
  LOBBY_STARTED: "Lobby already started.",
  MISSING_PENDING_TIER: "Missing pending tier.",
  MISSING_RESOLUTION: "Missing resolution",
  NAME_REQUIRED: "Name required.",
  NAME_TAKEN: (name: string) => `Name "${name}" is already taken.`,
  NOT_A_PLAYER: "Not a player.",
  NOT_AUTHORIZED: "Auth Denied",
  NOT_DEBUG_MODE: "Debug controls are disabled.",
  NOT_ENOUGH_PLAYERS: "Need at least one player.",
  NOT_IN_ROOM: "Not in a room.",
  NOT_YOUR_TURN: "Not your turn.",
  NO_CURRENT_ITEM: "No current item.",
  NO_PLAYERS: "No players.",
  NO_PREV_SNAPSHOT: "No previous phase snapshot yet.",
  PLACER_CANNOT_VOTE: "Placer cannot vote on their own item.",
  SOCKET_ID_MISMATCH: "Socket ID mismatch.",
  TIER_SET_HAS_NO_ITEMS: "Tier set has no items.",
  TIER_SET_NOT_FOUND: "Unknown tier set.",
  TIER_SET_NOT_SELECTED: "Select a tier set first.",
} as const;

type ErrorsMap = typeof ERRORS;

export type ErrorKey = {
  [K in keyof ErrorsMap]: ErrorsMap[K] extends string ? K : never;
}[keyof ErrorsMap];

export function getErrorMessage(key: ErrorKey): string {
  return ERRORS[key];
}

export function getNameTakenMessage(name: string): string {
  return ERRORS.NAME_TAKEN(name);
}
