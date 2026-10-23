import { useEffect, useState } from 'react';
import { useGame } from './state/useGame';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Game } from './screens/Game';

const roomOf = () => /^\/r\/([A-Za-z0-9]+)/.exec(location.pathname)?.[1]?.toUpperCase() ?? null;

export function App() {
  const [roomId, setRoomId] = useState(roomOf);
  const g = useGame(roomId);

  useEffect(() => {
    const f = () => setRoomId(roomOf());
    addEventListener('popstate', f);
    return () => removeEventListener('popstate', f);
  }, []);
  // A fresh create lands us in its room.
  useEffect(() => {
    if (g.joined && g.joined.roomId !== roomId) {
      history.pushState(null, '', `/r/${g.joined.roomId}`);
      setRoomId(g.joined.roomId);
    }
  }, [g.joined, roomId]);

  if (!roomId) return <Home open={g.status === 'open'} error={g.error} onCreate={(name) => g.send({ t: 'create', name })} />;
  if (g.game) return <Game game={g.game} send={g.send} />;
  return <Lobby roomId={roomId} seated={!!g.joined} you={g.joined?.you} lobby={g.lobby} error={g.error} send={g.send} />;
}
