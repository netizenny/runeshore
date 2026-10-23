import { COSTS, OMEN_DECK, OMEN_NAME, OMEN_TEXT, PIECES, RESOURCES, type OmenKind, type ResourceCounts } from '@runeshore/shared';

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
];
