import { getAllRooms, deleteRoom, deleteRoomIfEmpty } from "./rooms.js";
import { clearRoomTimers, ONE_HOUR_MS } from "./timing.js";

const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS ?? ONE_HOUR_MS);
const CLEANUP_INTERVAL_MS = Number(
  process.env.CLEANUP_INTERVAL_MS ?? ONE_HOUR_MS,
);

let interval: NodeJS.Timeout | null = null;

/** The janitor sweeps rooms every interval for dead connections to clean up memory */
export function runRoomJanitor() {
  if (interval) return;

  interval = setInterval(() => {
    const now = Date.now();

    for (const room of getAllRooms()) {
      if (deleteRoomIfEmpty(room)) {
        clearRoomTimers(room.code);
        continue;
      }

      const last = room.lastActivityAt ?? room.createdAt ?? now;
      if (now - last > ROOM_TTL_MS) {
        clearRoomTimers(room.code);
        deleteRoom(room);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export function stopRoomJanitor() {
  if (!interval) return;
  clearInterval(interval);
  interval = null;
}
