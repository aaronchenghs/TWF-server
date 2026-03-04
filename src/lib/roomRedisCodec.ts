import type { ClientId, RoomCode } from "@twf/contracts";
import type { Room } from "../types/types.js";
import type { Guid } from "../types/guid.js";

type StringMapRecord = Record<string, string>;

type PersistedDeferredPlayer = {
  id: Guid;
  name: string;
  avatar: Room["state"]["players"][number]["avatar"];
  joinedAt: number;
  clientId: ClientId;
  socketIds: string[];
};

type PersistedRematchState = {
  queuedPlayerIds: Guid[];
  hostStarted: boolean;
  deferredByClientId: Record<ClientId, PersistedDeferredPlayer>;
  deferredClientIdBySocketId: StringMapRecord;
};

export type PersistedRoom = {
  schemaVersion: 1;
  code: RoomCode;
  state: Room["state"];
  adminConnectionId: string | null;
  adminClientId: ClientId | null;
  displayConnectionIds: string[];
  controllerBySocketId: StringMapRecord;
  controllerByClientId: StringMapRecord;
  clientIdBySocketId: StringMapRecord;
  socketIdByControllerId: StringMapRecord;
  itemQueue: Room["itemQueue"];
  debugHistory: Room["debugHistory"];
  lastActivityAt: number;
  createdAt: number;
  rematch: PersistedRematchState;
};

type DeserializeOptions = {
  resetConnections?: boolean;
};

function mapToRecord(map: ReadonlyMap<string, string>): StringMapRecord {
  return Object.fromEntries(map.entries());
}

function recordToMap(
  value: unknown,
  transformValue?: (raw: string) => string,
): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return map;

  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue !== "string") continue;
    map.set(key, transformValue ? transformValue(rawValue) : rawValue);
  }

  return map;
}

function setToArray(values: ReadonlySet<string>): string[] {
  return [...values];
}

function arrayToSet(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set<string>();
  return new Set(
    value.filter((entry): entry is string => typeof entry === "string"),
  );
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeDeferredByClientId(
  value: unknown,
): Record<ClientId, PersistedDeferredPlayer> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const next: Record<ClientId, PersistedDeferredPlayer> = {};

  for (const [clientId, rawDeferred] of Object.entries(value)) {
    if (
      typeof rawDeferred !== "object" ||
      rawDeferred === null ||
      Array.isArray(rawDeferred)
    ) {
      continue;
    }

    const deferred = rawDeferred as Record<string, unknown>;
    if (
      typeof deferred.id !== "string" ||
      typeof deferred.name !== "string" ||
      typeof deferred.avatar !== "string" ||
      typeof deferred.joinedAt !== "number" ||
      typeof deferred.clientId !== "string"
    ) {
      continue;
    }

    next[clientId] = {
      id: deferred.id as Guid,
      name: deferred.name,
      avatar: deferred.avatar as PersistedDeferredPlayer["avatar"],
      joinedAt: deferred.joinedAt,
      clientId: deferred.clientId,
      socketIds: Array.isArray(deferred.socketIds)
        ? deferred.socketIds.filter(
            (socketId): socketId is string => typeof socketId === "string",
          )
        : [],
    };
  }

  return next;
}

function clonePlayersWithResetConnections(
  room: Room,
): Room["state"]["players"] {
  return room.state.players.map((player) => ({
    ...player,
    connected: false,
  }));
}

/**
 * Converts an in-memory `Room` into a JSON-safe snapshot for Redis persistence.
 * All `Map` and `Set` fields are normalized to plain objects or arrays.
 */
export function serializeRoom(room: Room): PersistedRoom {
  return {
    schemaVersion: 1,
    code: room.code,
    state: structuredClone(room.state),
    adminConnectionId: room.adminConnectionId,
    adminClientId: room.adminClientId,
    displayConnectionIds: setToArray(room.displayConnectionIds),
    controllerBySocketId: mapToRecord(room.controllerBySocketId),
    controllerByClientId: mapToRecord(room.controllerByClientId),
    clientIdBySocketId: mapToRecord(room.clientIdBySocketId),
    socketIdByControllerId: mapToRecord(room.socketIdByControllerId),
    itemQueue: [...room.itemQueue],
    debugHistory: structuredClone(room.debugHistory),
    lastActivityAt: room.lastActivityAt,
    createdAt: room.createdAt,
    rematch: {
      queuedPlayerIds: setToArray(room.rematch.queuedPlayerIds) as Guid[],
      hostStarted: room.rematch.hostStarted,
      deferredByClientId: Object.fromEntries(
        [...room.rematch.deferredByClientId.entries()].map(
          ([clientId, deferred]) => [
            clientId,
            {
              ...deferred,
              socketIds: setToArray(deferred.socketIds),
            },
          ],
        ),
      ) as Record<ClientId, PersistedDeferredPlayer>,
      deferredClientIdBySocketId: mapToRecord(
        room.rematch.deferredClientIdBySocketId,
      ),
    },
  };
}

/**
 * Rehydrates a persisted room snapshot back into the in-memory `Room` shape.
 * When `resetConnections` is enabled, all socket-specific connection state is cleared
 * so a restored room can safely survive a server restart.
 */
export function deserializeRoom(
  raw: unknown,
  options: DeserializeOptions = {},
): Room {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw new Error("Persisted room payload must be an object.");

  const persisted = raw as Partial<PersistedRoom>;
  if (persisted.schemaVersion !== 1)
    throw new Error("Unsupported persisted room schema version.");

  if (!persisted.code || typeof persisted.code !== "string")
    throw new Error("Persisted room is missing a valid code.");

  if (!persisted.state || typeof persisted.state !== "object")
    throw new Error("Persisted room is missing state.");

  const room: Room = {
    code: persisted.code,
    state: structuredClone(persisted.state),
    adminConnectionId:
      typeof persisted.adminConnectionId === "string"
        ? persisted.adminConnectionId
        : null,
    adminClientId:
      typeof persisted.adminClientId === "string"
        ? persisted.adminClientId
        : null,
    displayConnectionIds: arrayToSet(persisted.displayConnectionIds),
    controllerBySocketId: recordToMap(
      persisted.controllerBySocketId,
      (value) => value as Guid,
    ) as Map<string, Guid>,
    controllerByClientId: recordToMap(
      persisted.controllerByClientId,
      (value) => value as Guid,
    ) as Map<ClientId, Guid>,
    clientIdBySocketId: recordToMap(
      persisted.clientIdBySocketId,
      (value) => value as ClientId,
    ) as Map<string, ClientId>,
    socketIdByControllerId: recordToMap(
      persisted.socketIdByControllerId,
    ) as Map<Guid, string>,
    itemQueue: Array.isArray(persisted.itemQueue)
      ? persisted.itemQueue.filter(
          (itemId): itemId is Room["itemQueue"][number] =>
            typeof itemId === "string",
        )
      : [],
    debugHistory: Array.isArray(persisted.debugHistory)
      ? structuredClone(persisted.debugHistory)
      : [],
    lastActivityAt: toFiniteNumber(persisted.lastActivityAt, Date.now()),
    createdAt: toFiniteNumber(persisted.createdAt, Date.now()),
    rematch: {
      queuedPlayerIds: new Set(
        (Array.isArray(persisted.rematch?.queuedPlayerIds)
          ? persisted.rematch?.queuedPlayerIds.filter(
              (playerId): playerId is Guid => typeof playerId === "string",
            )
          : []) as Guid[],
      ),
      hostStarted: Boolean(persisted.rematch?.hostStarted),
      deferredByClientId: new Map(
        Object.entries(
          normalizeDeferredByClientId(persisted.rematch?.deferredByClientId),
        ).map(([clientId, deferred]) => [
          clientId as ClientId,
          {
            ...deferred,
            socketIds: new Set(deferred.socketIds),
          },
        ]),
      ),
      deferredClientIdBySocketId: recordToMap(
        persisted.rematch?.deferredClientIdBySocketId,
        (value) => value as ClientId,
      ) as Map<string, ClientId>,
    },
  };

  if (options.resetConnections) {
    room.adminConnectionId = null;
    room.displayConnectionIds.clear();
    room.controllerBySocketId.clear();
    room.clientIdBySocketId.clear();
    room.socketIdByControllerId.clear();
    room.state = {
      ...room.state,
      players: clonePlayersWithResetConnections(room),
    };
    room.rematch.deferredClientIdBySocketId.clear();

    for (const deferred of room.rematch.deferredByClientId.values()) {
      deferred.socketIds.clear();
    }
  }

  return room;
}
