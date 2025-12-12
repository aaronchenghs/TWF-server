import { v4 as uuidv4 } from "uuid";

/**
 * Nominal/Branded string type for UUID/GUID values.
 * Prevents accidentally passing plain strings where a Guid is expected.
 */
export type Guid = string & { readonly __brand: "Guid" };

export function newGuid(): Guid {
  return uuidv4() as Guid;
}

export function isGuid(value: string): value is Guid {
  // strict-ish UUID v4 check
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
