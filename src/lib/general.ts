import { Filter } from "bad-words";
import {
  RoomCode,
  CODE_LENGTH,
  TierId,
  TierSetDefinition,
  TierItemId,
} from "@twf/contracts";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PROFANITY = new Filter({ placeHolder: "*" });

export function makeCode(): RoomCode {
  for (;;) {
    const code = Array.from(
      { length: CODE_LENGTH },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
    ).join("");

    if (!PROFANITY.isProfane(code.toUpperCase())) return code as RoomCode;
  }
}

export const normalizeCode = (code: string) => code.trim().toUpperCase();
export const normalizeName = (name: string | undefined) => name?.trim() ?? "";

export function makeEmptyTiers(
  def: TierSetDefinition,
): Record<TierId, TierItemId[]> {
  const out: Record<TierId, TierItemId[]> = {};
  for (const t of def.tiers) out[t.id] = [];
  return out;
}
