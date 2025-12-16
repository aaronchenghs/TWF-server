import { CODE_LENGTH } from "./constants/codes.js";
import type { RoomCode, TierId } from "./types/types.js";

export function makeCode(): RoomCode {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const EMPTY_TIERS: Record<TierId, string[]> = {
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
} as const;
