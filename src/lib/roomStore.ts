import type { RoomCode } from "@twf/contracts";
import type { Room } from "../types/types.js";
import { readNumberEnv, readStringEnv } from "./env.js";
import { closeRedis, connectRedis, isRedisConfigured } from "./redis.js";
import { ONE_HOUR_MS } from "./timing.js";
import {
  PersistedRoom,
  deserializeRoom,
  serializeRoom,
} from "./roomRedisCodec.js";

const DEFAULT_KEY_PREFIX = "twf:";
const pendingRoomStoreOps = new Set<Promise<void>>();

function getRedisKeyPrefix(): string {
  return (
    readStringEnv("REDIS_KEY_PREFIX", DEFAULT_KEY_PREFIX) || DEFAULT_KEY_PREFIX
  );
}

function getRoomPersistTtlMs(): number {
  return readNumberEnv("ROOM_PERSIST_TTL_MS", ONE_HOUR_MS, {
    min: 1,
  });
}

function getRoomKey(code: RoomCode): string {
  return `${getRedisKeyPrefix()}room:${code}`;
}

function getRoomIndexKey(): string {
  return `${getRedisKeyPrefix()}rooms:index`;
}

function logRoomStoreError(context: string, error: unknown): void {
  console.error(`[roomStore] ${context}`, error);
}

async function persistSerializedRoom(snapshot: PersistedRoom): Promise<void> {
  const client = await connectRedis();
  if (!client) return;

  await client.set(getRoomKey(snapshot.code), JSON.stringify(snapshot), {
    PX: getRoomPersistTtlMs(),
  });
  await client.sAdd(getRoomIndexKey(), snapshot.code);
}

async function deletePersistedRoom(code: RoomCode): Promise<void> {
  const client = await connectRedis();
  if (!client) return;

  await Promise.all([
    client.del(getRoomKey(code)),
    client.sRem(getRoomIndexKey(), code),
  ]);
}

function trackRoomStoreOp(op: Promise<void>): void {
  pendingRoomStoreOps.add(op);
  void op.finally(() => {
    pendingRoomStoreOps.delete(op);
  });
}

/**
 * Returns whether room snapshots should be written to Redis in this process.
 * This is intentionally a lightweight runtime check around Redis configuration.
 */
export function isRoomPersistenceEnabled(): boolean {
  return isRedisConfigured();
}

/**
 * Initializes the optional Redis-backed persistence layer during server startup.
 * When Redis is not configured this resolves without doing any work.
 */
export async function initializeRoomStore(): Promise<void> {
  await connectRedis();
}

/**
 * Closes the Redis-backed persistence layer during server shutdown.
 */
export async function shutdownRoomStore(): Promise<void> {
  if (pendingRoomStoreOps.size > 0)
    await Promise.allSettled([...pendingRoomStoreOps]);
  await closeRedis();
}

/**
 * Loads persisted room snapshots from Redis and converts them back into live
 * in-memory rooms. Restored rooms always have connection-specific state cleared
 * so they can be safely resumed after a server restart.
 */
export async function loadHydratedRooms(): Promise<Room[]> {
  const client = await connectRedis();
  if (!client) return [];

  const roomCodes = await client.sMembers(getRoomIndexKey());
  const hydratedRooms: Room[] = [];

  for (const roomCode of roomCodes) {
    const payload = await client.get(getRoomKey(roomCode));
    if (!payload) {
      await client.sRem(getRoomIndexKey(), roomCode);
      continue;
    }

    try {
      hydratedRooms.push(
        deserializeRoom(JSON.parse(payload) as unknown, {
          resetConnections: true,
        }),
      );
    } catch (error) {
      logRoomStoreError(`Skipping invalid persisted room ${roomCode}.`, error);
      await Promise.all([
        client.del(getRoomKey(roomCode)),
        client.sRem(getRoomIndexKey(), roomCode),
      ]);
    }
  }

  return hydratedRooms;
}

/**
 * Persists the latest room snapshot in the background.
 * This phase-1 implementation is best-effort by design and does not block emits.
 */
export function scheduleRoomPersist(room: Room): void {
  if (!isRoomPersistenceEnabled()) return;

  const snapshot = serializeRoom(room);
  const op = persistSerializedRoom(snapshot).catch((error) => {
    logRoomStoreError(`Failed to persist room ${room.code}.`, error);
  });

  trackRoomStoreOp(op);
}

/**
 * Removes a room snapshot and its index entry from Redis in the background.
 */
export function scheduleRoomDelete(code: RoomCode): void {
  if (!isRoomPersistenceEnabled()) return;

  const op = deletePersistedRoom(code).catch((error) => {
    logRoomStoreError(`Failed to delete persisted room ${code}.`, error);
  });

  trackRoomStoreOp(op);
}
