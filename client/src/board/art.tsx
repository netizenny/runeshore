import type { ReactNode } from 'react';
import type { Resource, Terrain } from '@runeshore/shared';

// All art is hand-drawn SVG, local coordinates around (0,0), hex size S = 50.
export const S = 50;
const GOLD = 'var(--ink-gold)';
const INK = '#14122b'; // dark linework: gold lines vanish on bright terrain
const ink = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

export const TERRAIN_FILL: Record<Terrain, string> = {
  clay: '#d9694a',
  timber: '#2e9e5e',
  fleece: '#b4de6e',
  harvest: '#f5cc3f',
  starmetal: '#8c84f0',
  ashen: '#e8c98a',
  deep: '#2a8fc4',
  glimmer: '#d278e8',
  mist: '#d4d8de',
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
      <g fill="#3f8a4c">
        <path d="M-22 22 V4 Q-22 0 -18 0 Q-14 0 -14 4 V22 Z" />
        <path d="M-22 14 H-27 Q-30 14 -30 10 V6 M-14 12 H-10 Q-7 12 -7 8 V4" fill="none" stroke="#3f8a4c" strokeWidth={4} />
        <path d="M20 -6 V-20 Q20 -23 23 -23 Q26 -23 26 -20 V-6 Z" transform="scale(0.9)" />
      </g>
    </g>
  ),
  deep: (
    <g {...ink} fill="none" opacity={0.5}>
      <path d="M-30 -6 Q-15 -16 0 -6 T30 -6" />
      <path d="M-24 14 Q-9 4 6 14 T36 14" />
    </g>
  ),
  glimmer: (
    <g {...ink}>
      <defs>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
          {['#ff5d5d', '#ffb347', '#ffe66d', '#6ee07a', '#5cc8ff', '#a78bfa'].map((c, i) => <stop key={c} offset={i / 5} stopColor={c} />)}
        </linearGradient>
      </defs>
      <path d="M-26 20 L-16 -10 L-6 20 Z" fill="#5cc8ff" />
      <path d="M-6 20 L6 -26 L18 20 Z" fill="url(#rainbow)" />
      <path d="M18 20 L26 -4 L34 20 Z" fill="#ff7ab8" />
      <path d="M6 -26 L2 2 M6 -26 L12 4" fill="none" strokeWidth={0.9} />
      <path d="M-30 -20 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={GOLD} stroke="none" />
    </g>
  ),
  mist: (
    <g {...ink} fill="none" opacity={0.8}>
      <path d="M-36 -10 Q-24 -22 -12 -10 T12 -10 T36 -10" />
      <path d="M-30 4 Q-18 -8 -6 4 T18 4 T40 4" />
      <path d="M-36 18 Q-24 6 -12 18 T12 18 T36 18" />
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
      <circle r={18} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2 3" />
      <circle r={15} fill="#fff" stroke={INK} strokeWidth={2} />
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

// Banner flag off the coast edge midpoint (x,y), pointing out to sea along `ang` (radians).
// Two tethers run to the edge's corners `c1`/`c2`: those corners are the spots that dock at the port.
export function Port({ kind, x, y, ang, c1, c2 }: { kind: Resource | 'any'; x: number; y: number; ang: number; c1: { x: number; y: number }; c2: { x: number; y: number } }) {
  const fx = Math.cos(ang) * 28, fy = Math.sin(ang) * 28;
  return (
    <g transform={`translate(${x} ${y})`}>
      {[c1, c2].map((c, i) => (
        <g key={i}>
          <path d={`M${c.x - x} ${c.y - y} L${fx} ${fy}`} stroke={GOLD} strokeWidth={1.2} />
          <circle cx={c.x - x} cy={c.y - y} r={3} fill="#1f1b40" stroke={GOLD} strokeWidth={1.2} />
        </g>
      ))}
      <g transform={`translate(${fx} ${fy})`}>
        <path d={kind === 'any' ? 'M-17 -12 H17 V9 L0 15 L-17 9 Z' : 'M-26 -12 H26 V9 L0 15 L-26 9 Z'} fill="#1f1b40" stroke={GOLD} strokeWidth={1.3} />
        {kind === 'any' ? (
          <text y={4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--parchment)">3:1</text>
        ) : (
          <>
            {/* Same hex tile as the resource cards, so a port reads like its card. */}
            <g transform="translate(-14 -2) scale(.2)">
              <clipPath id={`px-${kind}`}><polygon points={HEX} /></clipPath>
              <polygon points={HEX} fill={TERRAIN_FILL[kind]} />
              <g clipPath={`url(#px-${kind})`}><TerrainArt terrain={kind} /></g>
              <polygon points={HEX} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            </g>
            <text x={11} y={4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--parchment)">2:1</text>
          </>
        )}
      </g>
    </g>
  );
}

const OUT = '#0b0a1a';
const HALO = { filter: 'drop-shadow(0 0 1.6px #fff) drop-shadow(0 0 1px #fff)' } as const;

export const Outpost = ({ color }: { color: string }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round">
    <path d="M-5 7 V-3 H-7 V-8 H-4 V-6 H-1.5 V-8 H1.5 V-6 H4 V-8 H7 V-3 H5 V7 Z" fill={color} />
    <path d="M-1.5 7 V3 Q0 1 1.5 3 V7" fill="#14122b" />
  </g>
);

export const Citadel = ({ color }: { color: string }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round">
    <path d="M-11 8 V-2 H-9 L-7 -12 L-5 -2 H-3 V-4 H3 V-2 H5 L7 -12 L9 -2 H11 V8 Z" fill={color} />
    <path d="M-2.5 8 V2 Q0 -1 2.5 2 V8" fill="#14122b" />
  </g>
);

export const PathLine = ({ a, b, color }: { a: { x: number; y: number }; b: { x: number; y: number }; color: string }) => (
  <g strokeLinecap="round">
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={10} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={OUT} strokeWidth={8} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={5} />
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={1} strokeDasharray="3 4" strokeOpacity={0.7} />
  </g>
);

export const Shade = () => (
  <g style={HALO}>
    <path d="M0 -16 Q10 -14 10 -2 Q10 8 14 14 Q8 11 5 15 Q0 10 -5 15 Q-8 11 -14 14 Q-10 8 -10 -2 Q-10 -14 0 -16 Z" fill="#0b0a1a" stroke={OUT} strokeWidth={1.3} strokeLinejoin="round" />
    <path d="M-6 -3 Q0 -9 6 -3 Q6 3 0 4 Q-6 3 -6 -3 Z" fill="#14122b" />
    <circle cx={-2.5} cy={-2} r={1.4} fill="var(--blood)" />
    <circle cx={2.5} cy={-2} r={1.4} fill="var(--blood)" />
  </g>
);

// Same hex tile as the board: terrain fill + terrain art, so a card matches its hex.
const HEX = '0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25';
export const ResIcon = ({ r, size = 18 }: { r: Resource; size?: number }) => (
  <svg viewBox="-45 -51 90 102" width={size * 0.9} height={size} aria-label={r}>
    <clipPath id={`hx-${r}`}><polygon points={HEX} /></clipPath>
    <polygon points={HEX} fill={TERRAIN_FILL[r]} />
    <g clipPath={`url(#hx-${r})`}><TerrainArt terrain={r} /></g>
    <polygon points={HEX} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

// Expansion pieces. A Sentinel is a pennant on a post: rank = pips, hollow when inactive.
export const SentinelPiece = ({ color, rank, active }: { color: string; rank: 1 | 2 | 3; active: boolean }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1.4} strokeLinejoin="round" transform="scale(1.9)">
    <circle cy={-1} r={12} fill="#000" fillOpacity={0.55} stroke="none" />
    <path d="M0 8 V-10" fill="none" strokeWidth={1.8} />
    <path d="M0 -10 L10 -6 L0 -2 Z" fill={active ? color : '#000'} fillOpacity={active ? 1 : 0.5} stroke={active ? OUT : color} strokeWidth={1.8} strokeDasharray={active ? undefined : '2 2'} />
    {Array.from({ length: rank }, (_, i) => <circle key={i} cx={-4 + i * 4} cy={11} r={2} fill="#fff" stroke="none" />)}
  </g>
);

export const BulwarkRim = () => <circle r={13} fill="none" stroke={OUT} strokeWidth={2.2} strokeDasharray="4 2" />;

export const SpireCrest = ({ color }: { color: string }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1} strokeLinejoin="round" transform="translate(0 -17)">
    <path d="M0 -8 L4 0 H-4 Z" fill={color} />
  </g>
);

export const PeddlerToken = ({ color }: { color: string }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" transform="translate(-20 20)">
    <circle r={8} fill={color} />
    <path d="M-4 1 H4 M0 -4 V5" fill="none" />
  </g>
);

// Drowned Isles pieces. A Boat is a slim longboat with a shell sail, laid along its edge from a to b.
export const BoatPiece = ({ a, b, color }: { a: { x: number; y: number }; b: { x: number; y: number }; color: string }) => {
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return (
    <g style={HALO} transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2}) rotate(${ang})`} stroke={OUT} strokeWidth={1.1} strokeLinejoin="round">
      <path d="M-14 -3 H12 L17 -5 L12 4 H-12 Z" fill="#14122b" />
      <path d="M-1 -3 V-11" fill="none" />
      <path d="M-1 -11 Q8 -8 -1 -2 Z" fill={color} />
      <circle cx={16} cy={-5} r={1.6} fill="#fff" stroke="none" />
    </g>
  );
};

// The Raider: a ghost boat with a torn black sail and a green lantern.
export const RaiderPiece = () => (
  <g style={HALO} stroke={OUT} strokeWidth={1.3} strokeLinejoin="round">
    <path d="M-14 4 H14 L10 11 H-10 Z" fill="#0b0a1a" />
    <path d="M0 4 V-14" fill="none" />
    <path d="M0 -14 L12 -8 L8 -4 L12 0 L0 3 Z" fill="#0b0a1a" />
    <circle cx={-2} cy={-5} r={1.3} fill="#6fe39a" stroke="none" />
    <circle cx={-12} cy={2} r={2.2} fill="#6fe39a" stroke="none" />
  </g>
);

// Landfall flag: a small gold-edged pennant in the player's color, one per player per isle.
export const LandfallFlag = ({ color }: { color: string }) => (
  <g style={HALO} stroke={OUT} strokeWidth={1.1} strokeLinejoin="round">
    <path d="M0 8 V-8" fill="none" />
    <path d="M0 -8 L9 -5 L0 -2 Z" fill={color} />
  </g>
);
