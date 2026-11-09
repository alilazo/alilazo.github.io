import { cardNumber, canDouble, canSplit, handValue } from './engine.js';

function pairAction(rank, dealer, rules) {
  if (rank === 11 || rank === 8) return 'split';
  if (rank === 10) return 'stand';
  if (rank === 9) return [2, 3, 4, 5, 6, 8, 9].includes(dealer) ? 'split' : 'stand';
  if (rank === 7) return dealer <= 7 ? 'split' : 'hit';
  if (rank === 6) return dealer <= (rules.doubleAfterSplit ? 6 : 5) ? 'split' : 'hit';
  if (rank === 5) return dealer <= 9 ? 'double' : 'hit';
  if (rank === 4) return rules.doubleAfterSplit && [5, 6].includes(dealer) ? 'split' : 'hit';
  if (rank === 3 || rank === 2) return dealer <= (rules.doubleAfterSplit ? 7 : 6) ? 'split' : 'hit';
  return 'hit';
}

function softAction(total, dealer, rules) {
  if (total >= 20) return 'stand';
  if (total === 19) return rules.soft17 === 'hit' && dealer === 6 ? 'double' : 'stand';
  if (total === 18) {
    if (dealer >= 3 && dealer <= 6) return 'double';
    if ([2, 7, 8].includes(dealer)) return 'stand';
    return 'hit';
  }
  if (total === 17) return dealer >= 3 && dealer <= 6 ? 'double' : 'hit';
  if (total === 16 || total === 15) return dealer >= 4 && dealer <= 6 ? 'double' : 'hit';
  if (total === 14 || total === 13) return dealer >= 5 && dealer <= 6 ? 'double' : 'hit';
  return 'hit';
}

function hardAction(total, dealer, rules) {
  if (rules.surrender === 'late') {
    if (total === 16 && [9, 10, 11].includes(dealer)) return 'surrender';
    if (total === 15 && dealer === 10) return 'surrender';
  }
  if (total >= 17) return 'stand';
  if (total >= 13) return dealer <= 6 ? 'stand' : 'hit';
  if (total === 12) return dealer >= 4 && dealer <= 6 ? 'stand' : 'hit';
  if (total === 11) return dealer === 11 && rules.soft17 === 'stand' ? 'hit' : 'double';
  if (total === 10) return dealer <= 9 ? 'double' : 'hit';
  if (total === 9) return dealer >= 3 && dealer <= 6 ? 'double' : 'hit';
  return 'hit';
}

export function basicStrategy(cards, dealerCard, rules, context = {}) {
  const dealer = cardNumber(dealerCard);
  let action;
  if (canSplit(cards) && context.allowSplit !== false) action = pairAction(cardNumber(cards[0]), dealer, rules);
  const value = handValue(cards);
  if (!action) action = value.soft ? softAction(value.total, dealer, rules) : hardAction(value.total, dealer, rules);
  if (action === 'surrender' && context.afterSplit) action = hardAction(value.total, dealer, { ...rules, surrender: 'none' });
  if (action === 'double' && !canDouble(cards, rules, Boolean(context.afterSplit))) return value.soft && value.total >= 18 ? 'stand' : 'hit';
  return action;
}

const DEVIATIONS = [
  { total: 16, dealer: 10, index: 0, action: 'stand' },
  { total: 15, dealer: 10, index: 4, action: 'stand' },
  { total: 10, dealer: 10, index: 4, action: 'double' },
  { total: 12, dealer: 3, index: 2, action: 'stand' },
  { total: 12, dealer: 2, index: 3, action: 'stand' },
  { total: 11, dealer: 11, index: 1, action: 'double' },
  { total: 9, dealer: 2, index: 1, action: 'double' },
  { total: 10, dealer: 11, index: 4, action: 'double' },
  { total: 9, dealer: 7, index: 3, action: 'double' },
  { total: 16, dealer: 9, index: 5, action: 'stand' },
  { total: 13, dealer: 2, index: -1, action: 'hit', below: true },
  { total: 12, dealer: 4, index: 0, action: 'stand' },
  { total: 12, dealer: 5, index: -2, action: 'hit', below: true },
  { total: 12, dealer: 6, index: -1, action: 'hit', below: true },
  { total: 13, dealer: 3, index: -2, action: 'hit', below: true },
  { total: 15, dealer: 9, index: 5, action: 'stand' },
  { total: 10, dealer: 6, index: 4, action: 'double' },
  { total: 14, dealer: 10, index: 3, action: 'surrender', surrender: true },
  { total: 15, dealer: 10, index: 0, action: 'surrender', surrender: true },
  { total: 15, dealer: 9, index: 2, action: 'surrender', surrender: true },
  { total: 15, dealer: 11, index: 1, action: 'surrender', surrender: true },
];

export function deviationFor(cards, dealerCard, count, rules) {
  const value = handValue(cards);
  if (value.soft || canSplit(cards)) return null;
  const dealer = cardNumber(dealerCard);
  const matches = DEVIATIONS.filter((item) => item.total === value.total && item.dealer === dealer && (!item.surrender || rules.surrender === 'late'));
  const isActive = (item) => item.below ? count < item.index : count >= item.index;
  const match = matches.find((item) => item.surrender && isActive(item)) || matches.find(isActive);
  return match ? { ...match, label: `${value.total} vs ${dealer === 11 ? 'A' : dealer} at TC ${count >= 0 ? '+' : ''}${count}` } : null;
}

export function perfectAction(cards, dealerCard, count, rules, deviations = true, context = {}) {
  const deviation = deviations && !context.afterSplit ? deviationFor(cards, dealerCard, count, rules) : null;
  return { action: deviation?.action || basicStrategy(cards, dealerCard, rules, context), deviation };
}

export { DEVIATIONS };
