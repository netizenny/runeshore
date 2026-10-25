import type { GameState, PlayerColor, PlayerId, PlayerState, Settings } from '../types';
import { BANK_EACH, BANK_EACH_BIG, BOATS_PER_PLAYER, OMEN_DECK, OMEN_DECK_BIG, PIECES, RESOURCES, emptyCounts } from '../constants';
import { generateBoard, randomizeScenario, scenarioBoard, scenarioIsles } from '../board/generate';
import { hexId } from '../board/geometry';
import { SCENARIOS } from '../board/scenarios/landfall';
import { shuffle } from '../rng';
import { initHF } from './hf/state';
import { dealMist } from './mist';

export function createGame(players: { id: PlayerId; name: string; color: PlayerColor }[], settings: Settings, seed: number): GameState {
  let rng = seed >>> 0;
  let order: PlayerId[];
  [order, rng] = shuffle(players.map((p) => p.id), rng);
  const sc = settings.drownedIsles ? SCENARIOS[settings.scenario] : undefined;
  if (settings.drownedIsles && !sc) throw new Error('scenario not built yet');
  // Scenarios keep their isle shapes; terrains, tokens and port kinds are dealt fresh each game.
  const [board, afterBoard] = sc ? randomizeScenario(sc, scenarioBoard(sc), rng) : generateBoard(settings.boardMode, rng, settings.boardSize === 'large');
  const mistHexes = Object.values(board.hexes).filter((h) => h.terrain === 'mist').map((h) => h.id);
  const [mist, afterMist] = sc && mistHexes.length ? dealMist(sc, mistHexes, afterBoard) : [undefined, afterBoard];
  // No Omen deck in the expansion; skipping the shuffle keeps mode-off rng use unchanged.
  const [omenDeck, afterDeck] = settings.hollowFleet ? [[], afterMist] : shuffle(players.length > 4 ? OMEN_DECK_BIG : OMEN_DECK, afterMist);
  const [hf, afterHF] = settings.hollowFleet ? initHF(players.map((p) => p.id), afterDeck) : [undefined, afterDeck];
  const bank = emptyCounts();
  for (const r of RESOURCES) bank[r] = players.length > 4 ? BANK_EACH_BIG : BANK_EACH;
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
    // The Shade starts on the desert, or on a 12 token when the map has no desert (Veiled Reach).
    shadeHex: (Object.values(board.hexes).find((h) => h.terrain === 'ashen') ?? Object.values(board.hexes).find((h) => h.token === 12)!).id,
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
        raiderHex: hexId(sc.raiderStart[0], sc.raiderStart[1], sc.prefix),
        ...(mist && { mist }),
        landfall: Object.fromEntries(players.map((p) => [p.id, []])),
      },
    }),
    log: [],
  };
}
