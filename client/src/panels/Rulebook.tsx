import { useState } from 'react';
import { BOOKS } from '../rules/content';

export function Rulebook({ close }: { close(): void }) {
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const topics = BOOKS[tab].topics.filter((x) => !needle || `${x.title} ${x.text}`.toLowerCase().includes(needle));
  const sections = [...new Set(topics.map((x) => x.section))];
  return (
    <div className="modal rulebook" role="dialog" aria-label="Rulebook">
      <div className="rb-head">
        <h2>Rulebook</h2>
        {BOOKS.length > 1 && BOOKS.map((b, i) => <button key={b.tab} data-on={i === tab} onClick={() => setTab(i)}>{b.tab}</button>)}
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <button onClick={close} aria-label="Close">✕</button>
      </div>
      <div className="rb-body">
        {sections.map((s) => (
          <section key={s}>
            <h3>{s}</h3>
            {topics.filter((x) => x.section === s).map((x) => <p key={x.id}><b>{x.icon} {x.title}.</b> {x.text}</p>)}
          </section>
        ))}
        {!topics.length && <p>No entry matches.</p>}
      </div>
    </div>
  );
}
