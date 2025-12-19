import { RoomCode, CODE_LENGTH, TierId } from "@twf/contracts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeCode(): RoomCode {
  return Array.from(
    { length: CODE_LENGTH },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join("") as RoomCode;
}

export const normalizeCode = (code: string) => code.trim().toUpperCase();

export const EMPTY_TIERS: Record<TierId, string[]> = {
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
} as const;
