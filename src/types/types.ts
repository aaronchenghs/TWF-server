import { Guid } from "./generics";

export type RoomCode = string;
export type ClientRole = "display" | "controller" | "spectator";
export type TierId = "S" | "A" | "B" | "C" | "D";

export type PlayerPublic = {
  id: Guid;
  name: string;
  joinedAt: number;
};

export type RoomPublicState = {
  code: RoomCode;
  phase: "LOBBY" | "PICK" | "REVEAL" | "DISCUSS" | "VOTE" | "END";
  players: PlayerPublic[];
  tiers: Record<TierId, string[]>;
  currentTurnPlayerId: Guid | null;
  currentItem: string | null;
  timers: { discussEndsAt: number | null; voteEndsAt: number | null };
};

export type Room = {
  code: RoomCode;
  state: RoomPublicState;

  adminConnectionId: string | null;
  displayConnectionIds: Set<string>;

  controllerBySocketId: Map<string, Guid>;
};

export type ServerToClientEvents = {
  "room:state": (state: RoomPublicState) => void;
  "room:error": (message: string) => void;
  "debug:pong": (ts: number) => void;
};

export type ClientToServerEvents = {
  "room:create": (payload: { role: ClientRole }) => void;
  "room:join": (payload: {
    code: RoomCode;
    role: ClientRole;
    name?: string;
  }) => void;
  "debug:ping": (ts: number) => void;
};
