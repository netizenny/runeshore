import type { GameState, PlayerColor, PlayerId, PlayerState, Settings } from '../types';
import { BANK_EACH, BOATS_PER_PLAYER, OMEN_DECK, PIECES, RESOURCES, emptyCounts } from '../constants';
import { generateBoard, scenarioBoard, scenarioIsles } from '../board/generate';
import { SCENARIOS } from '../board/scenarios/landfall';
import { shuffle } from '../rng';
import { initHF } from './hf/state';

export function createGame(players: { id: PlayerId; name: string; color: PlayerColor }[], settings: Settings, seed: number): GameState {
  let rng = seed >>> 0;
  let order: PlayerId[];
  [order, rng] = shuffle(players.map((p) => p.id), rng);
  const sc = settings.drownedIsles ? SCENARIOS[settings.scenario] : undefined;
  if (settings.drownedIsles && !sc) throw new Error('scenario not built yet');
  // Scenario boards are fixed, so they leave rng untouched.
  const [board, afterBoard] = sc ? [scenarioBoard(sc), rng] : generateBoard(settings.boardMode, rng, settings.boardSize === 'large');
  // No Omen deck in the expansion; skipping the shuffle keeps mode-off rng use unchanged.
  const [omenDeck, afterDeck] = settings.hollowFleet ? [[], afterBoard] : shuffle(OMEN_DECK, afterBoard);
  const [hf, afterHF] = settings.hollowFleet ? initHF(players.map((p) => p.id), afterDeck) : [undefined, afterDeck];
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
    rngState: afterHF,
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
    ...(hf && { hf }),
    ...(sc && {
      di: {
        ...scenarioIsles(sc, board),
        boats: {},
        boatsLeft: Object.fromEntries(players.map((p) => [p.id, BOATS_PER_PLAYER])),
        builtTurn: {},
        movedTurn: 0,
        landfall: Object.fromEntries(players.map((p) => [p.id, []])),
      },
    }),
    log: [],
  };
}
