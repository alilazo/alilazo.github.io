import test from 'node:test';
import assert from 'node:assert/strict';
import { createShoe, handValue, hiLoValue, legalActions, seededRandom, settleHand, shuffle, trueCount } from '../js/engine.js';
import { normalizeSettings } from '../js/config.js';
import { basicStrategy, deviationFor } from '../js/strategy.js';
import { dollarsPerHour, evStatistics } from '../js/statistics.js';

const card = (rank, suit = '♠') => ({ rank, suit });

test('shoe composition and seeded shuffle are deterministic', () => {
  const shoe = createShoe(2);
  assert.equal(shoe.length, 104);
  assert.equal(shoe.filter((item) => item.rank === 'A').length, 8);
  assert.deepEqual(shuffle(shoe, seededRandom(42)), shuffle(shoe, seededRandom(42)));
});

test('a complete Hi-Lo deck is balanced', () => {
  assert.equal(createShoe(1).reduce((sum, item) => sum + hiLoValue(item), 0), 0);
});

test('hand values correctly soften aces', () => {
  assert.deepEqual(handValue([card('A'), card('6')]), { total: 17, soft: true, bust: false });
  assert.deepEqual(handValue([card('A'), card('6'), card('10')]), { total: 17, soft: false, bust: false });
  assert.equal(handValue([card('K'), card('Q'), card('2')]).bust, true);
});

test('rules change legal double and surrender actions', () => {
  const rules = normalizeSettings().rules;
  assert.ok(legalActions([card('5'), card('6')], rules).includes('double'));
  assert.ok(legalActions([card('8'), card('8')], rules).includes('split'));
  assert.ok(legalActions([card('10'), card('6')], rules).includes('surrender'));
  assert.ok(!legalActions([card('10'), card('6')], { ...rules, surrender: 'none' }).includes('surrender'));
  assert.ok(!legalActions([card('5'), card('4')], { ...rules, doubleRule: '10-11' }).includes('double'));
});

test('settlement handles blackjack, surrender, doubles, wins and pushes', () => {
  const rules = normalizeSettings().rules;
  assert.equal(settleHand([card('A'), card('K')], [card('10'), card('9')], 10, rules), 15);
  assert.equal(settleHand([card('10'), card('6')], [card('10'), card('7')], 10, rules, true), -5);
  assert.equal(settleHand([card('10'), card('9')], [card('10'), card('8')], 10, rules, false, true), 20);
  assert.equal(settleHand([card('10'), card('8')], [card('9'), card('9')], 10, rules), 0);
  assert.equal(settleHand([card('A'), card('K')], [card('10'), card('9')], 10, rules, false, false, true), 10);
});

test('strategy and deviations respond to rules and index thresholds', () => {
  const rules = normalizeSettings().rules;
  assert.equal(basicStrategy([card('8'), card('8')], card('10'), rules), 'split');
  assert.equal(basicStrategy([card('10'), card('6')], card('10'), rules), 'surrender');
  assert.equal(basicStrategy([card('10'), card('6')], card('10'), { ...rules, surrender: 'none' }), 'hit');
  assert.equal(basicStrategy([card('A'), card('7')], card('6'), { ...rules, doubleAfterSplit: false }, { afterSplit: true }), 'stand');
  assert.equal(basicStrategy([card('10'), card('6')], card('10'), rules, { afterSplit: true }), 'hit');
  assert.equal(deviationFor([card('10'), card('5')], card('10'), 0, rules)?.action, 'surrender');
  assert.equal(deviationFor([card('10'), card('6')], card('10'), -1, rules), null);
  assert.equal(deviationFor([card('10'), card('6')], card('10'), 0, rules)?.action, 'stand');
});

test('true count uses half-deck estimation and truncates toward zero', () => {
  assert.equal(trueCount(5, 104), 2);
  assert.equal(trueCount(-5, 104), -2);
  assert.equal(trueCount(3, 26), 6);
});

test('EV statistics expose units and monetary hourly estimates', () => {
  const stats = evStatistics(4, 2, 6);
  assert.equal(stats.ev100, 50);
  assert.ok(stats.margin95 > 0);
  assert.equal(dollarsPerHour(1.5, 10, 100), 15);
});
