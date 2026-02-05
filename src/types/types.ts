import {
  RoomCode,
  RoomPublicState,
  TierItemId,
  ClientId,
} from "@twf/contracts";
import { Guid } from "./guid.js";
import { DebugSnapshot } from "../lib/debug.js";

/**
 * Server‑side representation of a room.  Tracks both public state and internal
 * connection maps to support reattachment of controllers and host after refresh.
 */
export type Room = {
  code: RoomCode;
  state: RoomPublicState;

  /** Socket ID for the current host connection or null if host is offline */
  adminConnectionId: string | null;
  /** Stable clientId of the original host device */
  adminClientId: ClientId | null;
  /** Set of socket IDs that are acting as the host display */
  displayConnectionIds: Set<string>;
  /** Map of socket.id -> playerId */
  controllerBySocketId: Map<string, Guid>;
  /** Map of clientId -> playerId */
  controllerByClientId: Map<ClientId, Guid>;
  /** Map of socket.id -> clientId */
  clientIdBySocketId: Map<string, ClientId>;
  /** Map of playerId -> socket.id (for quick detachment) */
  socketIdByControllerId: Map<Guid, string>;

  itemQueue: TierItemId[];

  debugHistory: DebugSnapshot[];
  lastActivityAt: number;
  createdAt: number;
};
