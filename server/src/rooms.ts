import { randomInt } from 'node:crypto';
import { deleteRoom, loadRooms, saveRoom, DATA_DIR } from './persist';
import { Room } from './room';

const MAX_ROOMS = 200;
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

export class Rooms {
  private rooms = new Map<string, Room>();

  constructor(private dir = DATA_DIR) {}

  private opts() {
    return {
      save: (snap: Parameters<typeof saveRoom>[0]) => saveRoom(snap, this.dir),
      onExpire: (room: Room) => this.drop(room),
    };
  }

  drop(room: Room): void {
    room.dispose();
    this.rooms.delete(room.id);
    deleteRoom(room.id, this.dir);
  }

  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  create(): Room | null {
    if (this.rooms.size >= MAX_ROOMS) return null;
    let id: string;
    do id = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    while (this.rooms.has(id));
    const room = new Room(id, this.opts());
    this.rooms.set(id, room);
    return room;
  }

  load(): number {
    const snaps = loadRooms(this.dir);
    for (const s of snaps) {
      try {
        this.rooms.set(s.id, Room.restore(s, this.opts()));
      } catch (e) {
        console.warn(`skipping unrestorable room ${s.id}`, e);
      }
    }
    return this.rooms.size;
  }
}
