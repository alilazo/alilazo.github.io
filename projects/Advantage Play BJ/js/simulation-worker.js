import { canSplit, createShoe, drawCard, handValue, hiLoValue, isBlackjack, legalActions, playDealer, seededRandom, settleHand, shuffle, trueCount } from './engine.js';
import { perfectAction } from './strategy.js';
import { evStatistics } from './statistics.js';

let running = false;
let timer = null;
let state = null;
let speed = '1';

function wagerFor(count, spread) {
  if (count >= 4) return Number(spread.tc4) || 8;
  if (count === 3) return Number(spread.tc3) || 6;
  if (count === 2) return Number(spread.tc2) || 4;
  if (count === 1) return Number(spread.tc1) || 2;
  return Number(spread.min) || 1;
}

function reveal(card) {
  state.runningCount += hiLoValue(card);
}

function newShoe() {
  state.shoe = shuffle(createShoe(state.config.rules.decks), state.random);
  state.runningCount = 0;
  state.cutRemaining = Math.floor(state.shoe.length * (1 - state.config.rules.penetration / 100));
  state.shoes += 1;
}

function drawVisible(cards) {
  const card = drawCard(state.shoe);
  cards.push(card);
  reveal(card);
  return card;
}

function playPlayerHands(initialCards, dealerUp, count, bet) {
  const rules = state.config.rules;
  const hands = [{ cards: initialCards, bet, afterSplit: false, surrendered: false, doubled: false, complete: false }];
  const decisions = [];
  let cursor = 0;
  while (cursor < hands.length) {
    const hand = hands[cursor];
    if (hand.complete) { cursor += 1; continue; }
    const value = handValue(hand.cards);
    if (value.bust || value.total === 21) { hand.complete = true; cursor += 1; continue; }
    const legal = legalActions(hand.cards, rules, { afterSplit: hand.afterSplit, handCount: hands.length });
    let { action, deviation } = perfectAction(hand.cards, dealerUp, count, rules, state.config.deviations, { allowSplit: legal.includes('split'), afterSplit: hand.afterSplit });
    if (!legal.includes(action)) action = action === 'double' ? 'hit' : 'stand';
    decisions.push({ total: value.total, action, deviation: deviation?.label || null });
    if (action === 'stand') { hand.complete = true; cursor += 1; }
    else if (action === 'surrender') { hand.surrendered = true; hand.complete = true; cursor += 1; }
    else if (action === 'double') { hand.doubled = true; drawVisible(hand.cards); hand.complete = true; cursor += 1; }
    else if (action === 'split') {
      const splitCard = hand.cards.pop();
      const first = { cards: [hand.cards[0]], bet, afterSplit: true, surrendered: false, doubled: false, complete: false };
      const second = { cards: [splitCard], bet, afterSplit: true, surrendered: false, doubled: false, complete: false };
      drawVisible(first.cards); drawVisible(second.cards);
      const splitAces = first.cards[0].rank === 'A';
      if (splitAces && !rules.hitSplitAces) {
        first.complete = !(rules.resplitAces && canSplit(first.cards) && hands.length < rules.maxSplitHands);
        second.complete = !(rules.resplitAces && canSplit(second.cards) && hands.length < rules.maxSplitHands);
      }
      hands.splice(cursor, 1, first, second);
    } else drawVisible(hand.cards);
  }
  return { hands, decisions };
}

function simulateRound() {
  if (!state.shoe || state.shoe.length < state.cutRemaining + 20) newShoe();
  const startCount = trueCount(state.runningCount, state.shoe.length);
  const bet = wagerFor(startCount, state.config.betSpread);
  const player = [];
  const dealer = [];
  drawVisible(player);
  const dealerUp = drawVisible(dealer);
  drawVisible(player);
  let hole = state.config.rules.holeCard === 'us' ? drawCard(state.shoe) : null;
  if (hole) dealer.push(hole);
  const trace = { player: [...player], dealerUp, dealer: [], bet, trueCount: startCount, runningCount: state.runningCount, decisions: [] };
  let dealerHasBlackjack = hole ? isBlackjack(dealer) : false;
  const takesInsurance = state.config.rules.insurance && dealerUp.rank === 'A' && startCount >= 3;
  let insurance = takesInsurance && hole ? (dealerHasBlackjack ? bet : -bet / 2) : 0;
  if (dealerHasBlackjack && state.config.rules.holeCard === 'us') {
    reveal(hole);
    const profit = settleHand(player, dealer, bet, state.config.rules) + insurance;
    trace.dealer = [...dealer]; trace.result = profit; trace.reason = 'Dealer blackjack';
    return recordRound(profit, bet, startCount, trace);
  }
  const played = playPlayerHands(player, dealerUp, startCount, bet);
  trace.decisions = played.decisions;
  if (!hole) {
    hole = drawCard(state.shoe); dealer.push(hole); dealerHasBlackjack = isBlackjack(dealer);
    if (takesInsurance) insurance = dealerHasBlackjack ? bet : -bet / 2;
  }
  reveal(hole);
  if (!dealerHasBlackjack && played.hands.some((hand) => !hand.surrendered && !handValue(hand.cards).bust)) {
    playDealer(dealer, state.shoe, state.config.rules, reveal);
  }
  let profit = insurance;
  for (const hand of played.hands) profit += settleHand(hand.cards, dealer, hand.bet, state.config.rules, hand.surrendered, hand.doubled, hand.afterSplit);
  trace.playerHands = played.hands.map((hand) => [...hand.cards]);
  trace.dealer = [...dealer]; trace.result = profit;
  trace.reason = played.decisions.at(-1)?.deviation || `Basic Strategy: ${played.decisions.at(-1)?.action || 'settled'}`;
  return recordRound(profit, bet, startCount, trace);
}

function recordRound(profit, bet, count, trace) {
  state.hands += 1;
  state.profit += profit;
  state.totalBet += bet;
  state.sum += profit;
  state.sumSquares += profit * profit;
  state.counts[count] = (state.counts[count] || 0) + 1;
  state.evByCount[count] = (state.evByCount[count] || 0) + profit;
  state.bets[bet] = (state.bets[bet] || 0) + 1;
  if (state.hands === 1 || state.hands % Math.max(1, Math.floor(state.hands / 100)) === 0) state.history.push(state.profit);
  if (state.history.length > 240) state.history = state.history.filter((_, index) => index % 2 === 0);
  return trace;
}

function snapshot(trace) {
  const stats = evStatistics(state.hands, state.sum, state.sumSquares);
  return {
    seed: state.seed, hands: state.hands, shoes: state.shoes, profit: state.profit,
    averageBet: state.hands ? state.totalBet / state.hands : 0,
    ev100: stats.ev100, margin: stats.margin95, standardDeviation: stats.standardDeviation, history: state.history,
    counts: state.counts, evByCount: state.evByCount, bets: state.bets, trace,
  };
}

function schedule() {
  if (!running) return;
  const turbo = speed === 'turbo';
  const batch = turbo ? 1500 : 1;
  let trace;
  for (let index = 0; index < batch; index += 1) trace = simulateRound();
  self.postMessage({ type: 'progress', payload: snapshot(trace) });
  const multiplier = turbo ? 1 : Math.max(1, Number(speed));
  timer = setTimeout(schedule, turbo ? 10 : Math.max(40, 900 / multiplier));
}

function start(config, seed) {
  const numericSeed = Number(seed) || Date.now();
  state = {
    config, seed: numericSeed, random: seededRandom(numericSeed), shoe: null, cutRemaining: 0,
    runningCount: 0, hands: 0, shoes: 0, profit: 0, totalBet: 0, sum: 0, sumSquares: 0,
    history: [], counts: {}, evByCount: {}, bets: {},
  };
  running = true;
  schedule();
}

self.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'start') start(message.config, message.seed);
  if (message.type === 'resume' && state && !running) { running = true; schedule(); }
  if (message.type === 'pause') { running = false; clearTimeout(timer); self.postMessage({ type: 'paused', payload: snapshot(null) }); }
  if (message.type === 'speed') speed = String(message.speed || '1');
  if (message.type === 'reset') { running = false; clearTimeout(timer); state = null; self.postMessage({ type: 'reset' }); }
});
