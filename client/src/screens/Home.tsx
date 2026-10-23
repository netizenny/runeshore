import { useState } from 'react';
import { savedName } from '../state/useGame';

export function Home({ open, error, onCreate }: { open: boolean; error: string | null; onCreate(name: string): void }) {
  const [name, setName] = useState(savedName);
  return (
    <div className="screen">
      <h1>Runeshore</h1>
      <div className="row">
        <input value={name} maxLength={20} placeholder="Your name" onChange={(e) => setName(e.target.value)} />
        <button disabled={!open || !name.trim()} onClick={() => onCreate(name)}>Create room</button>
      </div>
      {error && <div className="err">{error}</div>}
    </div>
  );
}
