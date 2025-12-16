import { v4 as uuidv4 } from "uuid";
import { REGEX } from "../constants/regex";

/**
 * Nominal/Branded string type for UUID/GUID values.
 * Prevents accidentally passing plain strings where a Guid is expected.
 */
export type Guid = string & { readonly __brand: "Guid" };

export function newGuid(): Guid {
  return uuidv4() as Guid;
}

export function isGuid(value: string): value is Guid {
  return REGEX.GUID.test(value);
}
