import { useMemo } from 'react';
import type { Action, Hex } from '@runeshore/shared';
import { boardGeometry, edgeVertices, hexPixel, hexVertices, vertexPixel, type PlayerView } from '@runeshore/shared';
import { BoatPiece, BulwarkRim, Citadel, LandfallFlag, Outpost, PathLine, PeddlerToken, Port, RaiderPiece, S, SentinelPiece, Shade, SpireCrest, TERRAIN_FILL, TerrainArt, Token } from './art';

export type Mode = 'outpost' | 'path' | 'boat' | 'citadel' | 'shade' | 'sentinel' | 'arcana' | null;

// A clickable spot chosen by the Game screen for the expansion modes.
export type Pick = { kind: 'vertex' | 'hex' | 'edge'; id: string; go(): void };

const OUTPOST: Action['type'][] = ['placeOutpost', 'buildOutpost'];
const PATH: Action['type'][] = ['placePath', 'buildPath'];

export function Board({ view, legal, mode, onAction, pick = [] }: { view: PlayerView; legal: Action[]; mode: Mode; onAction(a: Action): void; pick?: Pick[] }) {
  const colorOf = (id: string) => `var(--${view.players.find((p) => p.id === id)!.color})`;
  const hexes = Object.values(view.board.hexes);
  const k = hexes.length > 61 ? 1.75 : hexes.length > 19 ? 1.4 : 1;
  const edgePts = useMemo(
    () => Object.fromEntries(boardGeometry(view.board).edges.map((e) => [e, edgeVertices(e).map((v) => vertexPixel(v, S))])),
    [view.board],
  );
  // One flag per player per isle, stacked beside the isle's first hex.
  const landfallFlags = Object.entries(view.di?.landfall ?? {}).flatMap(([owner, isles], pi) => isles.map((isle) => {
    const hex = Object.keys(view.di!.isleOf).find((h) => view.di!.isleOf[h] === isle)!;
    const { x, y } = hexPixel(hex, S);
    return { key: owner + isle, owner, x: x - 26 + pi * 9, y: y - 30 };
  }));
  const poly = (h: Hex) => hexVertices(h.id).map((v) => { const p = vertexPixel(v, S); return `${p.x},${p.y}`; }).join(' ');

  const vertexActs = legal.filter((a) => (mode === 'outpost' && OUTPOST.includes(a.type)) || (mode === 'citadel' && a.type === 'buildCitadel')) as Extract<Action, { vertex: string }>[];
  const edgeActs = legal.filter((a) => mode === 'path' && PATH.includes(a.type)) as Extract<Action, { edge: string }>[];
  const hexActs = legal.filter((a) => mode === 'shade' && a.type === 'moveShade') as Extract<Action, { hex: string }>[];

  return (
    <svg viewBox={`${-290 * k} ${-270 * k} ${580 * k} ${540 * k}`} style={{ width: '100%', height: '100%' }} role="img" aria-label="Runeshore board">
      <rect x={-290 * k} y={-270 * k} width={580 * k} height={540 * k} fill="var(--night)" />
      <g fill="none" stroke="var(--ink-gold-dim)" strokeWidth={0.8} opacity={0.35}>
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M-280 ${-250 + i * 62} q35 -9 70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0 t70 0`} />)}
      </g>

      {hexes.map((h) => {
        const { x, y } = hexPixel(h.id, S);
        return (
          <g key={h.id}>
            <polygon points={poly(h)} fill={TERRAIN_FILL[h.terrain]} stroke="var(--ink-gold)" strokeWidth={1.8} strokeLinejoin="round" />
            <g transform={`translate(${x} ${y})`}>
              <TerrainArt terrain={h.terrain} />
              {h.token && <Token n={h.token} />}
              {view.shadeHex === h.id && <g transform="translate(20 -20)"><Shade /></g>}
              {view.di?.raiderHex === h.id && <g transform="translate(0 -4) scale(1.5)"><RaiderPiece /></g>}
            </g>
          </g>
        );
      })}

      {view.board.ports.map((p) => {
        const [a, b] = p.edge.split('~');
        const land = view.board.hexes[a] ? a : b;
        const sea = land === a ? b : a;
        const pl = hexPixel(land, S);
        const ps = hexPixel(sea, S);
        const [v1, v2] = edgeVertices(p.edge).map((v) => vertexPixel(v, S));
        return <Port key={p.edge} kind={p.kind} x={(v1.x + v2.x) / 2} y={(v1.y + v2.y) / 2} ang={Math.atan2(ps.y - pl.y, ps.x - pl.x)} c1={v1} c2={v2} />;
      })}

      {Object.entries(view.paths).map(([e, owner]) => <PathLine key={e} a={edgePts[e][0]} b={edgePts[e][1]} color={colorOf(owner)} />)}
      {Object.entries(view.di?.boats ?? {}).map(([e, owner]) => <BoatPiece key={'bt' + e} a={edgePts[e][0]} b={edgePts[e][1]} color={colorOf(owner)} />)}
      {landfallFlags.map((f) => <g key={f.key} transform={`translate(${f.x} ${f.y})`}><LandfallFlag color={colorOf(f.owner)} /></g>)}
      {Object.keys(view.buildings).map((v) => {
        const b = view.buildings[v];
        if (!b) return null;
        const { x, y } = vertexPixel(v, S);
        return <g key={v} transform={`translate(${x} ${y})`}>{b.kind === 'outpost' ? <Outpost color={colorOf(b.owner)} /> : <Citadel color={colorOf(b.owner)} />}</g>;
      })}
      {Object.entries(view.hf?.sentinels ?? {}).map(([v, k]) => {
        const { x, y } = vertexPixel(v, S);
        return <g key={'s' + v} transform={`translate(${x + 18} ${y - 4})`}><SentinelPiece color={colorOf(k.owner)} rank={k.rank} active={k.active} /></g>;
      })}
      {(view.hf?.bulwarks ?? []).map((v) => { const { x, y } = vertexPixel(v, S); return <g key={'b' + v} transform={`translate(${x} ${y})`}><BulwarkRim /></g>; })}
      {Object.values(view.hf?.spires ?? {}).map((sp) => { if (!sp) return null; const { x, y } = vertexPixel(sp.vertex, S); return <g key={'p' + sp.vertex} transform={`translate(${x} ${y})`}><SpireCrest color={colorOf(sp.owner)} /></g>; })}
      {view.hf?.peddler && (() => { const { x, y } = hexPixel(view.hf!.peddler!.hex, S); return <g transform={`translate(${x} ${y})`}><PeddlerToken color={colorOf(view.hf!.peddler!.owner)} /></g>; })()}

      {edgeActs.map((a) => {
        const [p, q] = edgePts[a.edge];
        return <line key={a.edge} className="hit" x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth={12} strokeLinecap="round" onClick={() => onAction(a)} />;
      })}
      {vertexActs.map((a) => {
        const { x, y } = vertexPixel(a.vertex, S);
        return <circle key={a.vertex} className="hit" cx={x} cy={y} r={9} onClick={() => onAction(a)} />;
      })}
      {pick.map((p) => {
        if (p.kind === 'edge') { const [a, b] = edgePts[p.id]; return <line key={p.id} className="hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={12} strokeLinecap="round" onClick={p.go} />; }
        const { x, y } = p.kind === 'vertex' ? vertexPixel(p.id, S) : hexPixel(p.id, S);
        return <circle key={p.kind + p.id} className="hit" cx={x} cy={y} r={p.kind === 'vertex' ? 9 : S * 0.7} onClick={p.go} />;
      })}
      {hexActs.map((a) => {
        const { x, y } = hexPixel(a.hex, S);
        return <circle key={a.hex} className="hit" cx={x} cy={y} r={S * 0.7} onClick={() => onAction(a)} />;
      })}
    </svg>
  );
}
