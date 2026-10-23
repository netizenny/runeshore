import { useMemo } from 'react';
import type { Action, Hex } from '@runeshore/shared';
import { ALL_EDGES, ALL_VERTICES, edgeVertices, hexPixel, hexVertices, vertexPixel, type PlayerView } from '@runeshore/shared';
import { Citadel, Outpost, PathLine, Port, S, Shade, TERRAIN_FILL, TerrainArt, Token } from './art';

export type Mode = 'outpost' | 'path' | 'citadel' | 'shade' | null;

const OUTPOST: Action['type'][] = ['placeOutpost', 'buildOutpost'];
const PATH: Action['type'][] = ['placePath', 'buildPath'];

export function Board({ view, legal, mode, onAction }: { view: PlayerView; legal: Action[]; mode: Mode; onAction(a: Action): void }) {
  const colorOf = (id: string) => `var(--${view.players.find((p) => p.id === id)!.color})`;
  const hexes = Object.values(view.board.hexes);
  const edgePts = useMemo(
    () => Object.fromEntries(ALL_EDGES.map((e) => [e, edgeVertices(e).map((v) => vertexPixel(v, S))])),
    [],
  );
  const poly = (h: Hex) => hexVertices(h.id).map((v) => { const p = vertexPixel(v, S); return `${p.x},${p.y}`; }).join(' ');

  const vertexActs = legal.filter((a) => (mode === 'outpost' && OUTPOST.includes(a.type)) || (mode === 'citadel' && a.type === 'buildCitadel')) as Extract<Action, { vertex: string }>[];
  const edgeActs = legal.filter((a) => mode === 'path' && PATH.includes(a.type)) as Extract<Action, { edge: string }>[];
  const hexActs = legal.filter((a) => mode === 'shade' && a.type === 'moveShade') as Extract<Action, { hex: string }>[];

  return (
    <svg viewBox="-290 -270 580 540" style={{ width: '100%', height: '100%' }} role="img" aria-label="Runeshore board">
      <rect x={-290} y={-270} width={580} height={540} fill="var(--night)" />
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
        return <Port key={p.edge} kind={p.kind} x={(v1.x + v2.x) / 2} y={(v1.y + v2.y) / 2} ang={Math.atan2(ps.y - pl.y, ps.x - pl.x)} />;
      })}

      {Object.entries(view.paths).map(([e, owner]) => <PathLine key={e} a={edgePts[e][0]} b={edgePts[e][1]} color={colorOf(owner)} />)}
      {ALL_VERTICES.map((v) => {
        const b = view.buildings[v];
        if (!b) return null;
        const { x, y } = vertexPixel(v, S);
        return <g key={v} transform={`translate(${x} ${y})`}>{b.kind === 'outpost' ? <Outpost color={colorOf(b.owner)} /> : <Citadel color={colorOf(b.owner)} />}</g>;
      })}

      {edgeActs.map((a) => {
        const [p, q] = edgePts[a.edge];
        return <line key={a.edge} className="hit" x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth={12} strokeLinecap="round" onClick={() => onAction(a)} />;
      })}
      {vertexActs.map((a) => {
        const { x, y } = vertexPixel(a.vertex, S);
        return <circle key={a.vertex} className="hit" cx={x} cy={y} r={9} onClick={() => onAction(a)} />;
      })}
      {hexActs.map((a) => {
        const { x, y } = hexPixel(a.hex, S);
        return <circle key={a.hex} className="hit" cx={x} cy={y} r={S * 0.7} onClick={() => onAction(a)} />;
      })}
    </svg>
  );
}
