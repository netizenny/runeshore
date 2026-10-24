import type { Action, ArcanaArg, GameState, PlayerId } from '../../types';
import { COMMODITIES, INVENTOR_FIXED, RESOURCES } from '../../constants';
import { boardGeometry, vertexEdges } from '../../board/geometry';
import { pathSpotOk } from '../build';
import { hfPlayer } from './state';
import { KINDS, cardTotal, others } from './arcana-trade';

const pairs = <T>(xs: T[]): [T, T][] => xs.flatMap((a, i) => xs.slice(i + 1).map((b): [T, T] => [a, b]));

// Cheap candidate arguments for every Arcana card the player holds; legalActions confirms each with applyAction.
export function arcanaCandidates(s: GameState, id: PlayerId): Action[] {
  const hf = s.hf!;
  const foes = others(s, id);
  const hexes = Object.keys(s.board.hexes);
  const mine = Object.keys(s.buildings).filter((v) => s.buildings[v].owner === id);
  const knights = Object.keys(hf.sentinels).filter((v) => hf.sentinels[v].owner === id);
  const touching = boardGeometry(s.board).vertices.filter((v) => vertexEdges(v).some((e) => s.paths[e] === id));

  const argsFor = (card: string): ArcanaArg[] => {
    switch (card) {
      case 'alchemist':
        return Array.from({ length: 36 }, (_, i) => ({ dice: [(i % 6) + 1, Math.floor(i / 6) + 1] as [number, number] }));
      case 'engineer':
      case 'medicine':
        return mine.map((vertex) => ({ vertex }));
      case 'inventor':
        return pairs(hexes.filter((h) => s.board.hexes[h].token !== null && !INVENTOR_FIXED.includes(s.board.hexes[h].token!))).map((hexes) => ({ hexes }));
      case 'roadbuilding':
        return boardGeometry(s.board).edges.filter((e) => pathSpotOk(s, id, e)).map((e) => ({ edges: [e] }));
      case 'smith':
        return [...knights.map((v) => ({ vertices: [v] })), ...pairs(knights).map((vertices) => ({ vertices }))];
      case 'harbor': {
        const swappers = foes.filter((o) => COMMODITIES.some((c) => hfPlayer(s, o).commodities[c]));
        if (!swappers.length) return [{ offers: {} }];
        return RESOURCES.map((r) => ({ offers: Object.fromEntries(swappers.map((o) => [o, r])) }));
      }
      case 'mastermerchant':
        return foes.flatMap((target) => {
          const n = Math.min(2, cardTotal(s, target));
          const takes = n === 0 ? [[]] : n === 1 ? KINDS.map((k) => [k]) : [...KINDS.map((k) => [k, k]), ...pairs(KINDS)];
          return takes.map((take) => ({ target, take }));
        });
      case 'peddler':
      case 'bishop':
        return hexes.map((hex) => ({ hex }));
      case 'merchantfleet':
        return KINDS.map((kind) => ({ kind }));
      case 'resmonopoly':
        return RESOURCES.map((resource) => ({ resource }));
      case 'trademonopoly':
        return COMMODITIES.map((commodity) => ({ commodity }));
      case 'deserter':
        return foes.flatMap((target) => [{ target }, ...touching.map((place) => ({ target, place }))]);
      case 'diplomat':
        return Object.keys(s.paths).map((edge) => ({ edge }));
      case 'intrigue':
        return Object.keys(hf.sentinels).filter((v) => hf.sentinels[v].owner !== id).map((vertex) => ({ vertex }));
      case 'spy':
        return foes.flatMap((target) => [...new Set(hfPlayer(s, target).arcana)].map((takeCard) => ({ target, takeCard })));
      default:
        return [{}];
    }
  };
  return [...new Set(hfPlayer(s, id).arcana)].flatMap((card) => argsFor(card).map((arg): Action => ({ type: 'playArcana', card, arg })));
}
