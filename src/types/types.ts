import { RoomCode, RoomPublicState, TierItemId } from "@twf/contracts";
import { Guid } from "./guid";

export type Room = {
  code: RoomCode;
  state: RoomPublicState;
  adminConnectionId: string | null;
  displayConnectionIds: Set<string>;
  controllerBySocketId: Map<string, Guid>;
  itemQueue: TierItemId[];
};
