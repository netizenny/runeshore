import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameState, PlayerColor, PlayerId, Settings } from '@runeshore/shared';

export type RoomSnapshot = {
  id: string;
  seats: { id: PlayerId; name: string; color: PlayerColor; seatToken: string; autopilot: boolean }[];
  host: PlayerId;
  settings: Settings;
  game: GameState | null;
};

export const DATA_DIR = join(process.env.RUNESHORE_DATA ?? 'data', 'rooms');

export function saveRoom(snap: RoomSnapshot, dir = DATA_DIR): void {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${snap.id}.json`);
  writeFileSync(`${file}.tmp`, JSON.stringify(snap));
  renameSync(`${file}.tmp`, file);
}

export function loadRooms(dir = DATA_DIR): RoomSnapshot[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out: RoomSnapshot[] = [];
  for (const f of files) {
    try {
      out.push(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    } catch {
      console.warn(`skipping unreadable snapshot ${f}`);
    }
  }
  return out;
}

export function deleteRoom(id: string, dir = DATA_DIR): void {
  rmSync(join(dir, `${id}.json`), { force: true });
}
