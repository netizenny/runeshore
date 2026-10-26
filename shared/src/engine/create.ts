import type { GameState, PlayerColor, PlayerId, PlayerState, Settings } from '../types';
import { BANK_EACH, BANK_EACH_BIG, BOATS_PER_PLAYER, OMEN_DECK, OMEN_DECK_BIG, PIECES, RESOURCES, emptyCounts } from '../constants';
import { generateBoard, randomizeScenario, scenarioBoard, scenarioIsles } from '../board/generate';
import { hexId } from '../board/geometry';
import { SCENARIOS } from '../board/scenarios/landfall';
import { randInt, shuffle } from '../rng';
import { initHF } from './hf/state';
import { dealMist } from './mist';

export function createGame(players: { id: PlayerId; name: string; color: PlayerColor }[], settings: Settings, seed: number): GameState {
  let rng = seed >>> 0;
  let order: PlayerId[];
  [order, rng] = shuffle(players.map((p) => p.id), rng);
  const sc = settings.drownedIsles ? SCENARIOS[settings.scenario] : settings.boardSize === 'volcano' ? SCENARIOS.volcano : undefined;
  if (settings.drownedIsles && !sc) throw new Error('scenario not built yet');
  // Scenarios keep their isle shapes; terrains, tokens and port kinds are dealt fresh each game.
  const [board, afterBoard] = sc ? randomizeScenario(sc, scenarioBoard(sc), rng) : generateBoard(settings.boardMode, rng, settings.boardSize === 'large');
  const mistHexes = Object.values(board.hexes).filter((h) => h.terrain === 'mist').map((h) => h.id);
  const [mist, afterMist] = sc && mistHexes.length ? dealMist(sc, mistHexes, afterBoard) : [undefined, afterBoard];
  // No Omen deck in the expansion; skipping the shuffle keeps mode-off rng use unchanged.
  const [omenDeck, afterDeck] = settings.hollowFleet ? [[], afterMist] : shuffle(players.length > 4 ? OMEN_DECK_BIG : OMEN_DECK, afterMist);
  const [hf, afterHF] = settings.hollowFleet ? initHF(players.map((p) => p.id), afterDeck) : [undefined, afterDeck];
  // The Shade starts on the desert (a random one on Volcano), or on a 12 token when the map has no desert (Veiled Reach).
  const deserts = Object.values(board.hexes).filter((h) => h.terrain === 'ashen');
  const [pick, afterShade] = sc?.base ? randInt(afterHF, deserts.length) : [0, afterHF];
  const shadeHex = (deserts[pick] ?? Object.values(board.hexes).find((h) => h.token === 12)!).id;
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
    rngState: afterShade,
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
    shadeHex,
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
        boatsLeft: Object.fromEntries(players.map((p) => [p.id, sc.base ? 0 : BOATS_PER_PLAYER])),
        builtTurn: {},
        movedTurn: 0,
        ...(sc.base && { base: true as const }),
        raiderHex: sc.base ? null : hexId(sc.raiderStart[0], sc.raiderStart[1], sc.prefix),
        ...(sc.random && { startZone: Object.values(board.hexes).filter((h) => sc.random!.corner.includes(h.terrain)).map((h) => h.id) }),
        ...(mist && { mist, fogHexes: mistHexes }),
        landfall: Object.fromEntries(players.map((p) => [p.id, []])),
      },
    }),
    log: [],
  };
}
