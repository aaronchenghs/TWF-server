import type { RoomCode, TierId } from "./types/types.js";

export function makeCode(len = 4): RoomCode {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function emptyTiers(): Record<TierId, string[]> {
  return { S: [], A: [], B: [], C: [], D: [] };
}
