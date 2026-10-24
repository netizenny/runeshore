import { ARCANA, ARCANA_HAND_MAX, COSTS, FLEET_TRACK, IMPROVE_MAX, OMEN_DECK, OMEN_NAME, OMEN_TEXT, PIECES, RESOURCES, type OmenKind, type ResourceCounts } from '@runeshore/shared';

export type Topic = { id: string; section: string; title: string; text: string; icon?: string };
export type Book = { tab: string; topics: Topic[] };

const price = (c: ResourceCounts) => RESOURCES.filter((r) => c[r]).map((r) => `${c[r]} ${r}`).join(', ');
const t = (section: string, title: string, text: string, icon?: string): Topic => ({ id: `${section}/${title}`, section, title, text, icon });

const TERMS: [string, string][] = [
  ['Glory', 'Victory points. First to the target on your own turn wins.'],
  ['Path', 'A road. Links your pieces and extends your reach.'],
  ['Outpost', 'A settlement. 1 Glory. Produces 1 card per matching roll.'],
  ['Citadel', 'A city. 2 Glory. Produces 2 cards per matching roll.'],
  ['The Shade', 'The robber. Blocks the hex it sits on. Starts on the Ash hex.'],
  ['Clay / Timber / Fleece / Harvest / Starmetal', 'The five resources: brick, lumber, wool, grain, ore.'],
  ['Ash', 'The desert hex. Produces nothing.'],
  ['Runes', 'Development cards.'],
  ['Warriors', 'Knight card.'],
  ['Twin Paths / Bounty / Hoard', 'Road building / Year of plenty / Monopoly.'],
  ['Relic', 'Victory point card.'],
  ['Warlord', 'Largest army. 2 Glory for 3+ Warriors played, most wins.'],
  ['Longest trail', 'Longest road. 2 Glory for 5+ connected paths, longest wins.'],
  ['Port', 'Harbor. Improves your vault trade rate.'],
];

const OMEN_ICON: Record<OmenKind, string> = { warden: '⚔️', relic: '🗿', waymaking: '🛤️', bounty: '💰', hoard: '🧺' };

export const BOOKS: Book[] = [
  {
    tab: 'Base game',
    topics: [
      ...TERMS.map(([a, b]) => t('Terms', a, b)),
      t('Pieces', 'Path', `Costs ${price(COSTS.path)}. You have ${PIECES.path}. Must touch one of your own pieces; an opponent outpost or citadel blocks passing through its corner.`),
      t('Pieces', 'Outpost', `Costs ${price(COSTS.outpost)}. You have ${PIECES.outpost}. Must sit on your own path and at least two paths from any other outpost or citadel.`),
      t('Pieces', 'Citadel', `Costs ${price(COSTS.citadel)}. You have ${PIECES.citadel}. Replaces one of your outposts, which returns to your supply.`),
      t('Turn', 'Setup', 'In snake order each player places two outposts, each with a path. Your second outpost gives one card from each adjacent land hex.'),
      t('Turn', 'Roll and production', 'Roll two dice. Every hex with that number pays its outposts 1 card and its citadels 2. If the vault cannot pay everyone, nobody takes that resource unless only one player is owed it.'),
      t('Turn', 'Rolling a 7', 'Players holding more than the discard limit (default 7) discard half, rounded down. Then the roller moves the Shade to another hex and steals one random card from a player there.'),
      t('Turn', 'Build and trade', 'After rolling, trade and build in any order, then end your turn.'),
      ...OMEN_DECK.filter((k, i) => OMEN_DECK.indexOf(k) === i).map((k) =>
        t('Runes', OMEN_NAME[k], `${OMEN_TEXT[k]}. Copies in deck: ${OMEN_DECK.filter((x) => x === k).length}.`, OMEN_ICON[k])),
      t('Runes', 'Buying and playing', `A Rune costs ${price(COSTS.omen)}. Play one per turn, never on the turn you bought it. Relics need no play and are revealed when you win.`),
      t('Ports and trading', 'Player trades', 'On your turn, offer cards to everyone or chosen players. Others accept or decline; you confirm one accepter.'),
      t('Ports and trading', 'Vault and ports', 'Vault trades are 4 for 1. An outpost or citadel on an any-port makes it 3 for 1. A matching resource port makes that resource 2 for 1.'),
      t('Winning', 'Reaching the target', 'Reach the Glory target (default 10) on your own turn. Hidden Relics count. Longest trail and Warlord can change hands at any time.'),
    ],
  },
  {
    tab: 'Siege of the Hollow Fleet',
    topics: [
      t('Terms', 'Vellum / Silk / Sigil', 'Commodities. Timber pays Vellum, Fleece pays Silk, Starmetal pays Sigil, on top of the usual card, from Citadels only. They trade 4:1 for anything (ports do not help) and count as cards when you discard.'),
      t('Terms', 'Lore / Guild / Crown', `The three improvement tracks, fed by Vellum, Silk and Sigil. Level n costs n of the track's commodity, max level ${IMPROVE_MAX}. You need a Citadel to improve. Level 3 abilities: Lore takes a free base resource when production gives you nothing; Guild trades commodities 2:1; Crown unlocks Mighty (rank 3) Sentinels.`),
      t('Terms', 'Spire', 'First to reach level 4 on a track claims its Spire on one of their Citadels: +2 Glory. Reaching level 5 first-past the holder takes it. A Spire Citadel is safe from the Fleet unless you have no other.'),
      t('Terms', 'Sentinel', `A guard on a vertex of your paths, replacing Wardens. Ranks 1 to 3. Build or promote for ${price(COSTS.sentinel)}; activate for ${price(COSTS.activate)}. Max 2 per rank. Only active Sentinels defend. An active Sentinel can move along your paths, displace a weaker one, or chase the Shade. One action per Sentinel per turn.`),
      t('Terms', 'Bulwark', `Costs ${price(COSTS.bulwark)} on a building of yours; raises your discard limit by 2. One per Citadel, up to 3. It does not protect against the Fleet.`),
      t('Terms', 'Shield of the shore', '1 Glory each, won by defending the shore best when the Fleet is held.'),
      t('Terms', 'Peddler', 'A token you place beside your building: 1 Glory while you hold it, and 2:1 trades in the resource of that hex.'),
      t('Terms', 'Arcana', `Cards drawn from the Lore, Guild or Crown stack. Hand limit ${ARCANA_HAND_MAX}. Chronicle and Charter score at once.`),
      t('The Hollow Fleet', 'The track', `The event die shows a ship or a track color. On a ship the Fleet advances one step along a ${FLEET_TRACK}-step track. On a color, each player whose level +1 is at least the red die draws an Arcana from that stack (skipped at a full hand).`),
      t('The Hollow Fleet', 'The attack', 'At the end of the track the Fleet attacks with strength equal to all Citadels on the board. Your defence is the total rank of your active Sentinels. If defence is at least strength the Fleet is held: top defender wins a Shield (ties choose an Arcana instead). Otherwise the weakest defender with a Citadel loses one back to an Outpost. After any attack all Sentinels go inactive, the track resets and the Shade wakes.'),
      t('The Hollow Fleet', 'Winning', 'First to the Glory target (13 in this mode) on your own turn.'),
      ...ARCANA.map((c) => t(`Arcana: ${c.track}`, c.name, c.text, '✦')),
    ],
  },
  {
    tab: 'Drowned Isles',
    topics: [
      t('Terms', 'Boat', `A longboat. Costs ${price(COSTS.boat)}; you have 15. It sits on an edge that touches the Deep and must start from your own coastal Outpost or Citadel, or extend your own Boat. A coast edge holds a Path or a Boat, never both.`, '⛵'),
      t('Terms', 'Deep', 'Open water hexes. They never produce. Boats sail on their edges; Outposts and Paths go on land.'),
      t('Terms', 'Glimmer field', 'A prism hex. When its number rolls, an Outpost picks 1 card and a Citadel picks 2, any resources you like from the vault. A short vault trims the picks. The Shade blocks it.'),
      t('Terms', 'Landfall', 'Build your first Outpost on a new isle (not your home isle) to plant a flag: +2 Glory, once per isle.'),
      t('Terms', 'The Raider', 'A ghost boat. Starts off the board. On a 7 you move the Shade OR the Raider. The Raider sits only on Deep hexes; steal 1 card from a player with a Boat beside it. It blocks building and moving Boats on its hex edges but not production.'),
      t('Boats', 'Linking', 'Paths and Boats join only at your own Outpost or Citadel on the shared corner.'),
      t('Boats', 'Moving a Boat', 'Once per turn, after the roll: lift one Boat you did not build this turn whose open end touches none of your other pieces, and set it down on any spot a new Boat could go. Not out of a closed route, and not away from the Raider.'),
      t('Boats', 'Longest trail', 'Paths and Boats count together as one route (minimum 5 for 2 Glory). An opposing Outpost or Citadel still breaks the chain.'),
      t('Setup', 'Veiled Reach', 'Mist hexes hide their land. Build a Path or Boat beside one to lift it: you take one card of its kind (or a Glimmer pick), and it then plays like any hex.'),
      t('Setup', 'Quartet Reach', 'Four equal isles in a ring. Start anywhere: your two Outposts may sit on different isles. Landfall pays for every isle you did not start on.'),
      t('Setup', 'Home isle', 'In First Landfall you place your starting Outposts on the home isle only; the other isles are reached by Boat.'),
    ],
  },
];
