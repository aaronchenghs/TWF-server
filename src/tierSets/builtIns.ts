import type { Tier, TierItem, TierSetDefinition } from "@twf/contracts";
import { readFileSync, readdirSync } from "node:fs";

export type BuiltInTierSet = TierSetDefinition & { coverImageSrc?: string };

const PRESETS_DIRECTORY_URL = new URL("./presets/", import.meta.url);
const PRESET_FILE_ORDER = [
  "us-national-parks-25-poc.json",
  "video-games-poc.json",
  "fast-food-poc.json",
  "gym-lifts-poc.json",
  "anime-poc.json",
  "movies-poc.json",
  "fruits-poc.json",
  "countries-poc.json",
  "programming-languages-poc.json",
  "colors-8-tiers-poc.json",
  "planets-9-tiers-poc.json",
  "coffee-3-tiers-poc.json",
];

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error(`${context} must be an object.`);
  return value as Record<string, unknown>;
}

function readRequiredString(
  value: unknown,
  field: string,
  context: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0)
    throw new Error(`${context}.${field} must be a non-empty string.`);
  return value;
}

function readOptionalString(
  value: unknown,
  field: string,
  context: string,
): string | undefined {
  if (value === undefined) return undefined;
  return readRequiredString(value, field, context);
}

function readRequiredArray(
  value: unknown,
  field: string,
  context: string,
): unknown[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${context}.${field} must be a non-empty array.`);
  return value;
}

function assertUniqueIds(
  ids: readonly string[],
  field: string,
  context: string,
): void {
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`${context} has duplicate ${field}: "${id}".`);
    }

    seen.add(id);
  }
}

function readTier(value: unknown, context: string): Tier {
  const record = asRecord(value, context);

  return {
    id: readRequiredString(record.id, "id", context),
    name: readRequiredString(record.name, "name", context),
    color: readRequiredString(record.color, "color", context),
  };
}

function readTierItem(value: unknown, context: string): TierItem {
  const record = asRecord(value, context);

  return {
    id: readRequiredString(record.id, "id", context),
    name: readRequiredString(record.name, "name", context),
    imageSrc: readRequiredString(record.imageSrc, "imageSrc", context),
  };
}

function readBuiltInTierSet(value: unknown, fileName: string): BuiltInTierSet {
  const context = `tier set preset "${fileName}"`;
  const record = asRecord(value, context);

  const tiers = readRequiredArray(record.tiers, "tiers", context).map(
    (tierValue, index) => readTier(tierValue, `${context} tier #${index + 1}`),
  );
  const items = readRequiredArray(record.items, "items", context).map(
    (itemValue, index) =>
      readTierItem(itemValue, `${context} item #${index + 1}`),
  );

  assertUniqueIds(
    tiers.map((tier) => tier.id),
    "tier ids",
    context,
  );
  assertUniqueIds(
    items.map((item) => item.id),
    "item ids",
    context,
  );

  const description = readOptionalString(
    record.description,
    "description",
    context,
  );
  const coverImageSrc = readOptionalString(
    record.coverImageSrc,
    "coverImageSrc",
    context,
  );

  return {
    id: readRequiredString(record.id, "id", context),
    title: readRequiredString(record.title, "title", context),
    ...(description === undefined ? {} : { description }),
    ...(coverImageSrc === undefined ? {} : { coverImageSrc }),
    tiers,
    items,
  };
}

function parsePresetFile(fileName: string): BuiltInTierSet {
  const fileUrl = new URL(fileName, PRESETS_DIRECTORY_URL);
  const fileContents = readFileSync(fileUrl, "utf8");

  try {
    return readBuiltInTierSet(JSON.parse(fileContents) as unknown, fileName);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse tier set preset "${fileName}".`, {
        cause: error,
      });
    }

    throw error;
  }
}

function loadBuiltInTierSets(): BuiltInTierSet[] {
  const orderByFileName = new Map(
    PRESET_FILE_ORDER.map((fileName, index) => [fileName, index]),
  );
  const fileNames = readdirSync(PRESETS_DIRECTORY_URL)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => {
      const leftOrder = orderByFileName.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = orderByFileName.get(right) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.localeCompare(right);
    });

  if (fileNames.length === 0) {
    throw new Error("No tier set preset JSON files were found.");
  }

  const tierSets = fileNames.map(parsePresetFile);

  assertUniqueIds(
    tierSets.map((tierSet) => tierSet.id),
    "tier set ids",
    "tier set presets",
  );

  return tierSets;
}

// Fail fast on startup if any preset asset is missing or malformed.
export const TIERSET_PRESETS: BuiltInTierSet[] = loadBuiltInTierSets();
