import type { ReactNode } from 'react';
import type { Resource, Terrain } from '@runeshore/shared';

// All art is hand-drawn SVG, local coordinates around (0,0), hex size S = 50.
export const S = 50;
const GOLD = 'var(--ink-gold)';
const ink = { stroke: GOLD, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

export const TERRAIN_FILL: Record<Terrain, string> = {
  clay: '#7d3f33',
  timber: '#244a39',
  fleece: '#52684a',
  harvest: '#8a6c2c',
  starmetal: '#3f3d7a',
  ashen: '#3b3749',
};

const pine = (x: number, y: number, k = 1) => (
  <g key={`${x},${y}`} transform={`translate(${x} ${y}) scale(${k})`}>
    <path d="M0 -16 L7 -6 H3 L9 3 H-9 L-3 -6 H-7 Z" fill="#183326" {...ink} />
    <path d="M0 3 V9" {...ink} />
  </g>
);

const TERRAIN_ART: Record<Terrain, ReactNode> = {
  clay: (
    <g fill="#5e2d26" {...ink}>
      <path d="M-30 14 L-22 -2 L-10 4 L-4 16 Z" />
      <path d="M-4 -20 L12 -26 L20 -10 L8 -2 L-6 -8 Z" />
      <path d="M10 16 L20 6 L32 12 L28 22 L14 24 Z" />
      <path d="M-22 -2 L-17 6 L-12 3 M12 -26 L10 -16 L16 -12 M20 6 L24 13" fill="none" />
    </g>
  ),
  timber: <g>{[pine(-22, 8), pine(0, -16, 1.1), pine(22, 6), pine(-6, 18, 0.8), pine(12, 20, 0.8)]}</g>,
  fleece: (
    <g {...ink}>
      <path d="M-40 18 Q-22 -6 0 18 Z" fill="#415739" />
      <path d="M-8 22 Q16 -12 40 20 Z" fill="#415739" />
      <g fill="#efe3c4" stroke="none">
        <ellipse cx="-20" cy="-14" rx="8" ry="5.5" />
        <ellipse cx="22" cy="-2" rx="8" ry="5.5" />
      </g>
      <g fill="#1f1b40" stroke="none">
        <circle cx="-27" cy="-13" r="3" />
        <circle cx="29" cy="-1" r="3" />
      </g>
    </g>
  ),
  harvest: (
    <g {...ink} fill="none">
      {[-24, -8, 8, 24].map((y) => (
        <path key={y} d={`M-34 ${y} Q-17 ${y - 6} 0 ${y} T34 ${y}`} />
      ))}
      {[-26, -14, -2, 10, 22].map((x) => (
        <path key={x} d={`M${x} 26 V-22 M${x} -8 l5 -5 M${x} -8 l-5 -5 M${x} 6 l5 -5 M${x} 6 l-5 -5`} strokeWidth={0.9} />
      ))}
    </g>
  ),
  starmetal: (
    <g fill="#5a58a8" {...ink}>
      <path d="M-30 22 L-22 -6 L-12 22 Z" />
      <path d="M-10 22 L2 -28 L14 22 Z" />
      <path d="M12 22 L24 -10 L34 22 Z" />
      <path d="M2 -28 L-2 4 M2 -28 L8 4 M-22 -6 L-20 12 M24 -10 L26 8" fill="none" strokeWidth={0.9} />
      <path d="M-30 -22 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 Z" fill={GOLD} stroke="none" />
    </g>
  ),
  ashen: (
    <g {...ink} fill="none">
      <path d="M-40 12 Q-20 -6 0 10 T40 8" />
      <path d="M-34 24 Q-14 8 6 22 T40 22" />
      <path d="M-30 -8 Q-12 -22 6 -8 T34 -12" />
      <g fill={GOLD} stroke="none">
        {[[-24, 0], [18, -22], [30, 14], [-8, 28], [8, 0]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.6} />)}
      </g>
    </g>
  ),
};

export const TerrainArt = ({ terrain }: { terrain: Terrain }) => <g opacity={0.9}>{TERRAIN_ART[terrain]}</g>;

export function Token({ n }: { n: number }) {
  const hot = n === 6 || n === 8;
  const pips = 6 - Math.abs(7 - n);
  const c = hot ? 'var(--blood)' : '#14122b';
  return (
    <g>
      <circle r={18} fill="none" stroke={GOLD} strokeWidth={1} strokeDasharray="2 3" />
      <circle r={15} fill="var(--parchment)" stroke={GOLD} strokeWidth={1.5} />
      <text y={3} textAnchor="middle" fontFamily="Cinzel, serif" fontWeight={700} fontSize={n > 9 ? 13 : 15} fill={c}>{n}</text>
      {Array.from({ length: pips }, (_, i) => (
        <circle key={i} cx={(i - (pips - 1) / 2) * 4} cy={9} r={1.2} fill={c} />
      ))}
    </g>
  );
}

const RESOURCE_GLYPH: Record<Resource, ReactNode> = {
  clay: <path d="M-4 3 L-2 -3 L3 -2 L4 3 Z" />,
  timber: <path d="M0 -5 L4 1 H-4 Z M0 1 V4" />,
  fleece: <path d="M-4 2 Q-4 -3 0 -3 Q4 -3 4 2 Z" />,
  harvest: <path d="M0 4 V-4 M0 -1 l3 -3 M0 -1 l-3 -3 M0 2 l3 -3 M0 2 l-3 -3" fill="none" />,
  starmetal: <path d="M0 -5 L3 0 L0 5 L-3 0 Z" />,
};

// Banner flag at (x,y) on the coast, pointing out to sea along `ang` (radians).
export function Port({ kind, x, y, ang }: { kind: Resource | 'any'; x: number; y: number; ang: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 0 L${Math.cos(ang) * 18} ${Math.sin(ang) * 18}`} stroke={GOLD} strokeWidth={1.2} />
      <g transform={`translate(${Math.cos(ang) * 28} ${Math.sin(ang) * 28})`}>
        <path d="M-14 -11 H14 V8 L0 14 L-14 8 Z" fill="#1f1b40" stroke={GOLD} strokeWidth={1.3} />
        <text y={-1} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--parchment)">{kind === 'any' ? '3:1' : '2:1'}</text>
        {kind !== 'any' && <g transform="translate(0 7) scale(.8)" fill={GOLD} stroke={GOLD} strokeWidth={1}>{RESOURCE_GLYPH[kind]}</g>}
      </g>
    </g>
  );
}

export const Outpost = ({ color }: { color: string }) => (
  <g stroke={GOLD} strokeWidth={1.2} strokeLinejoin="round">
    <path d="M-5 7 V-3 H-7 V-8 H-4 V-6 H-1.5 V-8 H1.5 V-6 H4 V-8 H7 V-3 H5 V7 Z" fill={color} />
    <path d="M-1.5 7 V3 Q0 1 1.5 3 V7" fill="#14122b" />
  </g>
);

export const Citadel = ({ color }: { color: string }) => (
  <g stroke={GOLD} strokeWidth={1.2} strokeLinejoin="round">
    <path d="M-11 8 V-2 H-9 L-7 -12 L-5 -2 H-3 V-4 H3 V-2 H5 L7 -12 L9 -2 H11 V8 Z" fill={color} />
    <path d="M-2.5 8 V2 Q0 -1 2.5 2 V8" fill="#14122b" />
  </g>
);

export const PathLine = ({ a, b, color }: { a: { x: number; y: number }; b: { x: number; y: number }; color: string }) => (
  <g strokeLinecap="round">
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#14122b" strokeWidth={8} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={5} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={GOLD} strokeWidth={1} strokeDasharray="3 4" />
  </g>
);

export const Shade = () => (
  <g>
    <path d="M0 -16 Q10 -14 10 -2 Q10 8 14 14 Q8 11 5 15 Q0 10 -5 15 Q-8 11 -14 14 Q-10 8 -10 -2 Q-10 -14 0 -16 Z" fill="#0b0a1a" stroke={GOLD} strokeWidth={1.3} strokeLinejoin="round" />
    <path d="M-6 -3 Q0 -9 6 -3 Q6 3 0 4 Q-6 3 -6 -3 Z" fill="#14122b" />
    <circle cx={-2.5} cy={-2} r={1.4} fill="var(--blood)" />
    <circle cx={2.5} cy={-2} r={1.4} fill="var(--blood)" />
  </g>
);

export const ResIcon = ({ r, size = 18 }: { r: Resource; size?: number }) => (
  <svg viewBox="-7 -7 14 14" width={size} height={size} fill={TERRAIN_FILL[r]} stroke={GOLD} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" aria-label={r}>{RESOURCE_GLYPH[r]}</svg>
);

// Expansion pieces. A Sentinel is a pennant on a post: rank = pips, hollow when inactive.
export const SentinelPiece = ({ color, rank, active }: { color: string; rank: 1 | 2 | 3; active: boolean }) => (
  <g stroke={GOLD} strokeWidth={1.1} strokeLinejoin="round">
    <path d="M0 8 V-10" fill="none" />
    <path d="M0 -10 L9 -6 L0 -2 Z" fill={active ? color : 'none'} stroke={active ? GOLD : color} strokeDasharray={active ? undefined : '2 2'} />
    {Array.from({ length: rank }, (_, i) => <circle key={i} cx={-4 + i * 4} cy={11} r={1.6} fill={GOLD} stroke="none" />)}
  </g>
);

export const BulwarkRim = () => <circle r={13} fill="none" stroke={GOLD} strokeWidth={2.2} strokeDasharray="4 2" />;

export const SpireCrest = ({ color }: { color: string }) => (
  <g stroke={GOLD} strokeWidth={1} strokeLinejoin="round" transform="translate(0 -17)">
    <path d="M0 -8 L4 0 H-4 Z" fill={color} />
  </g>
);

export const PeddlerToken = ({ color }: { color: string }) => (
  <g stroke={GOLD} strokeWidth={1.2} strokeLinejoin="round" transform="translate(-20 20)">
    <circle r={8} fill={color} />
    <path d="M-4 1 H4 M0 -4 V5" fill="none" />
  </g>
);
