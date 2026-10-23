import type { GameState, PlayerColor, PlayerId, PlayerState, Settings } from '../types';
import { BANK_EACH, OMEN_DECK, PIECES, RESOURCES, emptyCounts } from '../constants';
import { generateBoard } from '../board/generate';
import { shuffle } from '../rng';

export function createGame(players: { id: PlayerId; name: string; color: PlayerColor }[], settings: Settings, seed: number): GameState {
  let rng = seed >>> 0;
  let order: PlayerId[];
  [order, rng] = shuffle(players.map((p) => p.id), rng);
  const [board, afterBoard] = generateBoard(settings.boardMode, rng);
  const [omenDeck, afterDeck] = shuffle(OMEN_DECK, afterBoard);
  const bank = emptyCounts();
  for (const r of RESOURCES) bank[r] = BANK_EACH;
  const states: PlayerState[] = players.map((p) => ({
    ...p,
    hand: emptyCounts(),
    omens: [],
    wardensPlayed: 0,
    piecesLeft: { ...PIECES },
  }));
  return {
    seed,
    rngState: afterDeck,
    settings,
    board,
    players: states,
    order,
    current: 0,
    turn: 0,
    phase: { k: 'setup', round: 1, step: 'outpost' },
    omenPlayedThisTurn: false,
    buildings: {},
    paths: {},
    shadeHex: Object.values(board.hexes).find((h) => h.terrain === 'ashen')!.id,
    bank,
    omenDeck,
    offers: [],
    longestPath: null,
    grandHost: null,
    dice: null,
    log: [],
  };
}
