import { useState } from 'react';
import { savedName } from '../state/useGame';

// Flat island: sea, hill, hut, sun. Decorative only.
function Hero() {
  return (
    <svg className="hero" viewBox="0 0 320 150" aria-hidden="true">
      <circle cx="250" cy="42" r="22" fill="#ffd772" />
      <path d="M0 110 Q40 98 80 110 T160 110 T240 110 T320 110 V150 H0Z" fill="#2f7bff" opacity=".55" />
      <path d="M50 118 Q70 60 120 58 Q150 30 190 58 Q250 62 272 118 Q160 140 50 118Z" fill="#2ee05a" />
      <path d="M120 58 L150 20 L180 58Z" fill="#a050ff" />
      <rect x="196" y="82" width="34" height="26" fill="#fff6dc" />
      <path d="M190 84 L213 62 L236 84Z" fill="#ff4d42" />
      <path d="M0 126 Q40 114 80 126 T160 126 T240 126 T320 126 V150 H0Z" fill="#2f7bff" />
    </svg>
  );
}

export function Home({ open, error, onCreate }: { open: boolean; error: string | null; onCreate(name: string): void }) {
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState('');
  const join = () => { location.hash = `/r/${code.trim().toUpperCase()}`; };
  return (
    <div className="screen home">
      <Hero />
      <h1>Runeshore</h1>
      <label className="field">Your name
        <input value={name} maxLength={20} placeholder="Type your name" onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="go huge" disabled={!open || !name.trim()} onClick={() => onCreate(name)}>Start a game</button>
      {error && <div className="err" role="alert">{error}</div>}
      <form className="row join" onSubmit={(e) => { e.preventDefault(); if (code.trim()) join(); }}>
        <input aria-label="Room code" value={code} maxLength={6} placeholder="Join with code" autoCapitalize="characters" onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
        <button type="submit" disabled={code.trim().length < 4}>Join</button>
      </form>
    </div>
  );
}
