import { RoomCode, RoomPublicState, TierItemId } from "@twf/contracts";
import { Guid } from "./guid";

export type DebugSnapshot = {
  state: RoomPublicState;
  itemQueue: TierItemId[];
};

export type Room = {
  code: RoomCode;
  state: RoomPublicState;
  adminConnectionId: string | null;
  displayConnectionIds: Set<string>;
  controllerBySocketId: Map<string, Guid>;
  itemQueue: TierItemId[];
  timer: NodeJS.Timeout | null;
  scheduleNonce: number;

  debugHistory: DebugSnapshot[];
  lastActivityAt: number;
  createdAt: number;
};
