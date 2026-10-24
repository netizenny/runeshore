# Runeshore

A hex-island trading and building game for 2–4 players, played in the browser.

## Play on your own PC

1. Install Node 20 or newer.
2. In this folder run `npm install` once.
3. Run `npm run build`, then `npm start`.
4. Open http://localhost:3001, press Create, and send the room link to your friends.

For development with live reload use `npm run dev` instead and open http://localhost:5173.
If it fails with `EADDRINUSE`, another server is still using port 3001. Close it first.

## Play with friends on the same Wi-Fi

1. Start the game as above (`npm run build`, `npm start`).
2. Find your PC's address: run `ipconfig` and read "IPv4 Address" of your Wi-Fi adapter (for example `192.168.1.129`).
3. Friends open `http://<that address>:3001` in their browser.
4. If they cannot connect, Windows Firewall is blocking Node. Allow "Node.js JavaScript Runtime" on Private networks when Windows asks.

## Play over the internet for a night

1. Install once: `winget install Cloudflare.cloudflared`
2. Start the game (`npm start`).
3. In a second terminal run `cloudflared tunnel --url http://localhost:3001`
4. It prints a `https://….trycloudflare.com` link. Send it to your friends. The link stops working when you close the tunnel.

## Siege of the Hollow Fleet

The host ticks "Siege of the Hollow Fleet" in the lobby (Glory target becomes 13). Differences from the base game: a third event die moves the Hollow Fleet along a 7-step track; Citadels also pay Vellum, Silk and Sigil; you improve Lore, Guild and Crown with them; Sentinels replace Warriors and defend against the Fleet's attack; Bulwarks, Spires, the Peddler and 54 Arcana cards join in. There are no Runes in this mode. The in-game Rulebook has a tab for each rule.

## Notes

- A restarted server resumes unfinished games from `server/data/rooms`. Players just reload their tab.
- This folder is in OneDrive, which can lock those files. If the server logs `snapshot save failed`, move them out of OneDrive: set `RUNESHORE_DATA` to another folder (for example `set RUNESHORE_DATA=C:\runeshore-data` in the terminal before `npm start`).
- Your seat is remembered per browser tab. To test alone, use several tabs.
- "Back to lobby" on the win screen returns to the home page. Create a new room to play again.
- `npm test` runs the game rules and server tests.

## Hosting on Render (free)

1. Push the repo to GitHub, then in Render choose New > Blueprint and select it (`render.yaml` does the rest).
2. Open the `https://<name>.onrender.com` URL; share room links from there.
3. Limits: the service sleeps after about 15 min without traffic, and the free disk is wiped on every redeploy or restart, so a running game is lost then. Keep playing, and do not deploy mid-game.
