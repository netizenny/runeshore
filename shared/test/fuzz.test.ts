import { describe, expect, it } from 'vitest';
import { ARCANA_HAND_MAX, BULWARKS_MAX, COMMODITIES, HF_BANK_EACH, RESOURCES, SENTINELS_PER_RANK } from '../src/constants';
import { TRACKS } from '../src/engine/hf/state';
import type { GameState } from '../src/types';
import { drive, newGame } from './drive';

function invariants(s: GameState) {
  for (const r of RESOURCES) {
    const total = s.bank[r] + s.players.reduce((n, p) => n + p.hand[r], 0);
    if (total !== 19) throw new Error(`${r} total ${total}`);
    if (s.bank[r] < 0 || s.players.some((p) => p.hand[r] < 0)) throw new Error(`negative ${r}`);
  }
  const held = s.players.reduce((n, p) => n + p.omens.length, 0);
  const played = s.log.filter((e) => e.type === 'omenPlayed').length;
  if (!s.hf && s.omenDeck.length + held + played !== 25) throw new Error(`omens ${s.omenDeck.length}+${held}+${played}`);
  for (const p of s.players) {
    if (p.piecesLeft.path < 0 || p.piecesLeft.outpost < 0 || p.piecesLeft.citadel < 0) throw new Error('pieces < 0');
  }
}

describe('fuzz', () => {
  for (const n of [3, 4]) {
    it(`50 seeds with ${n} players end with a winner and keep invariants`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const { state, steps } = drive(newGame(seed, n), seed, 3000, invariants);
        expect(state.phase.k, `seed ${seed} after ${steps} steps`).toBe('ended');
        invariants(state);
      }
    }, 120_000);
  }
});

function hfInvariants(s: GameState) {
  invariants(s);
  const hf = s.hf!;
  for (const c of COMMODITIES) {
    const total = hf.bank[c] + s.players.reduce((n, p) => n + hf.players[p.id].commodities[c], 0);
    if (total !== HF_BANK_EACH || hf.bank[c] < 0) throw new Error(`${c} total ${total}`);
    if (s.players.some((p) => hf.players[p.id].commodities[c] < 0)) throw new Error(`negative ${c}`);
  }
  const cards = TRACKS.reduce((n, t) => n + hf.arcanaDecks[t].length, 0) + s.players.reduce((n, p) => n + hf.players[p.id].arcana.length + hf.players[p.id].extraRenown, 0);
  if (cards !== 54) throw new Error(`arcana ${cards}`);
  for (const p of s.players) {
    for (const rank of [1, 2, 3]) {
      if (Object.values(hf.sentinels).filter((k) => k.owner === p.id && k.rank === rank).length > SENTINELS_PER_RANK) throw new Error(`sentinels rank ${rank}`);
    }
    if (hf.bulwarks.filter((v) => s.buildings[v]?.owner === p.id).length > BULWARKS_MAX) throw new Error('bulwarks');
    if (hf.players[p.id].arcana.length > ARCANA_HAND_MAX) throw new Error('arcana hand');
  }
  if (hf.bulwarks.some((v) => s.buildings[v]?.kind !== 'citadel')) throw new Error('bulwark off a citadel');
  if (Object.keys(hf.sentinels).some((v) => s.buildings[v])) throw new Error('sentinel on a building');
}

describe('fuzz with Hollow Fleet', () => {
  for (const n of [3, 4]) {
    it(`40 seeds with ${n} players end with a winner and keep invariants`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const { state, steps } = drive(newGame(seed, n, { hollowFleet: true, renownTarget: 13 }), seed, 6000, hfInvariants);
        expect(state.phase.k, `seed ${seed} after ${steps} steps`).toBe('ended');
        hfInvariants(state);
      }
    }, 600_000);
  }
});
