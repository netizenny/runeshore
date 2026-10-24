import { ARCANA_BY_KEY, type Action, type ArcanaArg, type PlayerView } from '@runeshore/shared';
import type { Pick } from '../board/Board';

type Play = Extract<Action, { type: 'playArcana' }>;

export const playsOf = (legal: Action[], card: string) => legal.filter((a): a is Play => a.type === 'playArcana' && a.card === card);

// An argument that is one board spot can be clicked on the board; anything else is a list.
const spot = (arg: ArcanaArg | undefined): { kind: Pick['kind']; id: string } | null => {
  const keys = Object.keys(arg ?? {});
  if (keys.length !== 1) return null;
  const a = arg!;
  return a.hex ? { kind: 'hex', id: a.hex } : a.vertex ? { kind: 'vertex', id: a.vertex } : a.edge ? { kind: 'edge', id: a.edge } : null;
};

export const arcanaPicks = (plays: Play[], act: (a: Action) => void): Pick[] | null => {
  const spots = plays.map((a) => spot(a.arg));
  if (!spots.length || spots.some((s) => !s)) return null;
  return plays.map((a, i) => ({ ...spots[i]!, go: () => act(a) }));
};

function describe(arg: ArcanaArg | undefined, view: PlayerView): string {
  if (!arg || !Object.keys(arg).length) return 'Play';
  const who = (id: string) => view.players.find((p) => p.id === id)?.name ?? id;
  const hex = (h: string) => `${view.board.hexes[h]?.terrain} ${view.board.hexes[h]?.token ?? ''}`.trim();
  return Object.entries(arg).map(([k, v]) => {
    if (k === 'target') return who(v as string);
    if (k === 'hex') return hex(v as string);
    if (k === 'hexes') return (v as string[]).map(hex).join(' ↔ ');
    if (k === 'offers') return Object.entries(v as Record<string, string>).map(([p, r]) => `${who(p)}: ${r}`).join(', ');
    if (k === 'dice') return (v as number[]).join(' + ');
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'string') return k === 'takeCard' ? (ARCANA_BY_KEY[v]?.name ?? v) : v;
    return String(v);
  }).join(' · ');
}

export function ArcanaHand({ cards, legal, view, sel, setSel, act }: { cards: string[]; legal: Action[]; view: PlayerView; sel: string | null; setSel(c: string | null): void; act(a: Action): void }) {
  const plays = sel ? playsOf(legal, sel) : [];
  const listed = sel && !arcanaPicks(plays, act);
  return (
    <div className="arcana">
      {cards.map((c, i) => {
        const d = ARCANA_BY_KEY[c];
        const ok = playsOf(legal, c).length > 0;
        return (
          <button key={c + i} className={`arc ${d?.track}`} title={d?.text} disabled={!ok} data-on={sel === c} onClick={() => {
            const ps = playsOf(legal, c);
            if (ps.length === 1 && !Object.keys(ps[0].arg ?? {}).length) return act(ps[0]);
            setSel(sel === c ? null : c);
          }}>{d?.name ?? c}</button>
        );
      })}
      {listed && (
        <div className="pick arcana-args">
          {ARCANA_BY_KEY[sel!]?.text}
          <div className="arg-list">{plays.slice(0, 80).map((a, i) => <button key={i} onClick={() => act(a)}>{describe(a.arg, view)}</button>)}</div>
        </div>
      )}
      {sel && !listed && <div className="pick">{ARCANA_BY_KEY[sel]?.text} Click the board.</div>}
    </div>
  );
}
