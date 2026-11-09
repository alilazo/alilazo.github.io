const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function seededRandom(seed = Date.now()) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createShoe(decks = 6) {
  const cards = [];
  for (let deck = 0; deck < decks; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
  }
  return cards;
}

export function shuffle(cards, random = Math.random) {
  const result = cards.map((card) => ({ ...card }));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function cardNumber(card) {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.rank)) return 10;
  return Number(card.rank);
}

export function hiLoValue(card) {
  const value = cardNumber(card);
  if (value >= 2 && value <= 6) return 1;
  if (value === 10 || card.rank === 'A') return -1;
  return 0;
}

export function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + cardNumber(card), 0);
  let aces = cards.filter((card) => card.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0, bust: total > 21 };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function canSplit(cards) {
  return cards.length === 2 && cardNumber(cards[0]) === cardNumber(cards[1]);
}

export function canDouble(cards, rules, afterSplit = false) {
  if (cards.length !== 2 || (afterSplit && !rules.doubleAfterSplit)) return false;
  const total = handValue(cards).total;
  if (rules.doubleRule === '9-11') return total >= 9 && total <= 11;
  if (rules.doubleRule === '10-11') return total >= 10 && total <= 11;
  return true;
}

export function legalActions(cards, rules, context = {}) {
  const actions = ['hit', 'stand'];
  if (canDouble(cards, rules, Boolean(context.afterSplit))) actions.push('double');
  if (canSplit(cards) && (context.handCount || 1) < rules.maxSplitHands) actions.push('split');
  if (cards.length === 2 && !context.afterSplit && rules.surrender === 'late') actions.push('surrender');
  return actions;
}

export function trueCount(runningCount, cardsRemaining) {
  const remainingDecks = Math.max(0.5, Math.round((cardsRemaining / 52) * 2) / 2);
  return Math.trunc(runningCount / remainingDecks);
}

export function settleHand(playerCards, dealerCards, bet, rules, surrendered = false, doubled = false, afterSplit = false) {
  const wager = bet * (doubled ? 2 : 1);
  if (surrendered) return -bet / 2;
  const player = handValue(playerCards);
  const dealer = handValue(dealerCards);
  if (player.bust) return -wager;
  const playerBlackjack = isBlackjack(playerCards) && !afterSplit;
  if (playerBlackjack && !isBlackjack(dealerCards)) return bet * rules.blackjackPayout;
  if (isBlackjack(dealerCards) && !playerBlackjack) return -wager;
  if (dealer.bust || player.total > dealer.total) return wager;
  if (player.total < dealer.total) return -wager;
  return 0;
}

export function drawCard(shoe) {
  const card = shoe.pop();
  if (!card) throw new Error('Cannot draw from an empty shoe');
  return card;
}

export function playDealer(dealerCards, shoe, rules, reveal = () => {}) {
  while (true) {
    const value = handValue(dealerCards);
    if (value.total > 17 || (value.total === 17 && (!value.soft || rules.soft17 === 'stand'))) break;
    const card = drawCard(shoe);
    dealerCards.push(card);
    reveal(card);
  }
  return dealerCards;
}

export function formatCard(card) {
  return `${card.rank}${card.suit}`;
}
