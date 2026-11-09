import { ACHIEVEMENTS, normalizeSettings, rulesSummary } from './config.js';
import { appendLimited, loadData, saveData } from './storage.js';
import { checkSessionAchievements, checkVisualAchievement } from './achievements.js';
import { canSplit, createShoe, drawCard, formatCard, handValue, hiLoValue, isBlackjack, legalActions, playDealer, settleHand, shuffle, trueCount } from './engine.js';
import { basicStrategy, DEVIATIONS, perfectAction } from './strategy.js';
import { renderBars, renderLineChart } from './charts.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
let data = loadData();
let settings = normalizeSettings(data.settings);
let activeTab = 'play';
let play = null;
let drillMode = 'strategy';
let drill = null;
let visual = null;
let simWorker = null;
let simStatus = 'idle';
let simSnapshot = null;

function persist() {
  data.settings = settings;
  saveData(data);
}

function announceAchievement(item) {
  if (!item) return;
  const toast = $('#toast');
  toast.innerHTML = `<strong>Achievement unlocked</strong><br>${item.name}`;
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 4500);
  window.umami?.track?.('Advantage Play BJ - Achievement', { achievement: item.name });
}

function setTab(name) {
  activeTab = name;
  $$('[role="tab"]').forEach((button) => {
    const selected = button.dataset.tab === name;
    button.setAttribute('aria-selected', String(selected));
  });
  $$('.tab-panel').forEach((panel) => {
    const selected = panel.id === `panel-${name}`;
    panel.hidden = !selected;
    panel.classList.toggle('is-active', selected);
  });
  if (name === 'session') renderSession();
  if (name === 'history') renderHistory();
  window.history.replaceState(null, '', `#${name}`);
}

$$('[data-tab]').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
$$('[data-go-tab]').forEach((button) => button.addEventListener('click', () => {
  setTab(button.dataset.goTab);
  $('#appMain').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}));

const ruleFields = [
  ['decks', 'Decks', 'select', [[1, '1'], [2, '2'], [4, '4'], [6, '6'], [8, '8']]],
  ['penetration', 'Penetration %', 'number'],
  ['soft17', 'Dealer soft 17', 'select', [['stand', 'Stand'], ['hit', 'Hit']]],
  ['blackjackPayout', 'Blackjack payout', 'select', [[1.5, '3:2'], [1.2, '6:5']]],
  ['holeCard', 'Hole-card rule', 'select', [['us', 'US peek'], ['enhc', 'European no hole card']]],
  ['doubleRule', 'Doubling', 'select', [['any', 'Any two'], ['9-11', '9–11'], ['10-11', '10–11']]],
  ['surrender', 'Surrender', 'select', [['none', 'None'], ['late', 'Late']]],
  ['maxSplitHands', 'Max split hands', 'select', [[2, '2'], [3, '3'], [4, '4']]],
];
const ruleSwitches = [['doubleAfterSplit', 'Double after split'], ['resplitAces', 'Resplit aces'], ['hitSplitAces', 'Hit split aces'], ['insurance', 'Offer insurance']];

function ruleEditorMarkup() {
  return `<div class="rules-grid">${ruleFields.map(([key, label, type, options]) => `<label>${label}${type === 'select' ? `<select data-rule="${key}">${options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}</select>` : `<input data-rule="${key}" type="number" min="50" max="90">`}</label>`).join('')}</div>${ruleSwitches.map(([key, label]) => `<label class="switch"><input data-rule="${key}" type="checkbox"><span>${label}</span></label>`).join('')}`;
}

$$('[data-rules-editor]').forEach((container) => { container.innerHTML = ruleEditorMarkup(); });

function syncSettingsUI() {
  $$('[data-rule]').forEach((input) => {
    const value = settings.rules[input.dataset.rule];
    if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = String(value);
    input.disabled = Boolean(play?.active || simStatus === 'running' || simStatus === 'paused');
  });
  Object.entries(settings.betSpread).forEach(([key, value]) => { $$(`[data-spread="${key}"]`).forEach((input) => { input.value = value; }); });
  $('#automatedSeats').value = settings.automatedSeats;
  $('#trackCounting').checked = settings.trackCounting;
  $('#trackStrategy').checked = settings.trackStrategy;
  $('#trackDeviations').checked = settings.trackDeviations;
  $('#trackBetting').checked = settings.trackBetting;
  $('#settingBankroll').value = settings.bankroll;
  $('#settingUnit').value = settings.unit;
  $('#simUnit').value = settings.unit;
  $('#simHandsHour').value = settings.handsPerHour;
  $('#playBet').value = settings.unit;
  $('#playRulesSummary').textContent = rulesSummary(settings.rules);
}

document.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('[data-rule]')) {
    const key = input.dataset.rule;
    const numeric = ['decks', 'penetration', 'blackjackPayout', 'maxSplitHands'].includes(key);
    settings.rules[key] = input.type === 'checkbox' ? input.checked : numeric ? Number(input.value) : input.value;
    settings = normalizeSettings(settings); persist(); syncSettingsUI();
    $('#settingsStatus').textContent = 'Game rules saved for the next session.';
  }
  if (input.matches('[data-spread]')) { settings.betSpread[input.dataset.spread] = Math.max(1, Number(input.value) || 1); persist(); syncSettingsUI(); }
});

['automatedSeats', 'settingBankroll', 'settingUnit', 'simUnit', 'simHandsHour'].forEach((id) => $(`#${id}`).addEventListener('change', (event) => {
  const map = { automatedSeats: 'automatedSeats', settingBankroll: 'bankroll', settingUnit: 'unit', simUnit: 'unit', simHandsHour: 'handsPerHour' };
  settings[map[id]] = Number(event.target.value);
  settings = normalizeSettings(settings); persist(); syncSettingsUI();
}));
[['trackCounting', 'trackCounting'], ['trackStrategy', 'trackStrategy'], ['trackDeviations', 'trackDeviations'], ['trackBetting', 'trackBetting']].forEach(([id, key]) => $(`#${id}`).addEventListener('change', (event) => { settings[key] = event.target.checked; persist(); }));

function cardMarkup(card, hidden = false) {
  if (hidden) return '<span class="playing-card back" aria-label="Face-down card"></span>';
  const red = ['♥', '♦'].includes(card.suit);
  return `<span class="playing-card${red ? ' red' : ''}" aria-label="${card.rank} of ${card.suit}"><b>${card.rank}</b><small>${card.suit}</small></span>`;
}

function createSession() {
  return {
    id: crypto.randomUUID(), startedAt: new Date().toISOString(), active: true, rules: structuredClone(settings.rules),
    bankroll: settings.bankroll, shoe: shuffle(createShoe(settings.rules.decks)), initialShoe: settings.rules.decks * 52,
    cutRemaining: Math.floor(settings.rules.decks * 52 * (1 - settings.rules.penetration / 100)), runningCount: 0,
    dealer: [], playerHands: [], autoHands: [], round: 0, decisions: 0, correctDecisions: 0,
    strategyStreak: 0, bestStrategyStreak: 0, countStreak: 0, bestCountStreak: 0, correctDeviations: 0,
    deviationOpportunities: 0, roundResults: [], accuracySeries: [], busy: false,
  };
}

function revealToCount(card) { play.runningCount += hiLoValue(card); }
function visibleDraw(target) { const card = drawCard(play.shoe); target.push(card); revealToCount(card); return card; }
function ensureShoe() {
  if (play.shoe.length > play.cutRemaining + 20) return;
  play.shoe = shuffle(createShoe(play.rules.decks)); play.initialShoe = play.rules.decks * 52;
  play.cutRemaining = Math.floor(play.initialShoe * (1 - play.rules.penetration / 100)); play.runningCount = 0;
  $('#playFeedback').textContent = 'Cut card reached. The shoe was reshuffled and the count reset.';
}

function renderPlay() {
  if (!play) return;
  const dealerVisible = play.dealer.map((card, index) => cardMarkup(card, index === 1 && !play.dealerRevealed)).join('');
  $('#dealerCards').innerHTML = dealerVisible;
  const visibleDealer = play.dealerRevealed ? handValue(play.dealer).total : play.dealer[0] ? handValue([play.dealer[0]]).total : '';
  $('#dealerTotal').textContent = visibleDealer ? `Total ${visibleDealer}` : '';
  $('#playerHands').innerHTML = play.playerHands.map((hand, index) => `<div class="card-row${index === play.currentHand ? ' is-current' : ''}">${hand.cards.map((card) => cardMarkup(card)).join('')}</div>`).join('') || '<div class="card-row"></div>';
  const current = play.playerHands[play.currentHand];
  $('#playerTotal').textContent = current?.cards.length ? `Total ${handValue(current.cards).total}` : '';
  $('#autoSeats').innerHTML = play.autoHands.map((cards, index) => `<div class="auto-seat"><span class="position-label">Seat ${index + 1}</span><div class="card-row">${cards.map((card) => cardMarkup(card)).join('')}</div></div>`).join('');
  const used = 1 - play.shoe.length / play.initialShoe;
  $('#shoeFill').style.height = `${Math.max(4, (1 - used) * 100)}%`;
  $('#playBankroll').textContent = `Bankroll $${play.bankroll.toFixed(2)} · RC ${settings.trackCounting ? 'hidden' : play.runningCount}`;
}

function setDecisionButtons(enabled) {
  const hand = play?.playerHands[play?.currentHand];
  let legal = enabled && hand ? legalActions(hand.cards, play.rules, { afterSplit: hand.afterSplit, handCount: play.playerHands.length }) : [];
  if (hand?.splitAce && !play.rules.hitSplitAces) legal = play.rules.resplitAces && canSplit(hand.cards) && play.playerHands.length < play.rules.maxSplitHands ? ['split'] : [];
  $$('[data-action]').forEach((button) => { button.disabled = !legal.includes(button.dataset.action); });
}

function startSession() {
  if (play?.active) return;
  play = createSession();
  $('#startSession').disabled = true; $('#dealRound').disabled = false; $('#endSession').disabled = false;
  $('#playFeedback').textContent = 'Session started. Place your wager and deal the first round.';
  syncSettingsUI(); renderPlay(); renderSession();
}

function autoplaySeat(cards, dealerUp) {
  while (handValue(cards).total < 21) {
    let action = basicStrategy(cards, dealerUp, play.rules, { allowSplit: false });
    if (action === 'stand' || action === 'surrender') break;
    if (action === 'double') { visibleDraw(cards); break; }
    visibleDraw(cards);
    if (handValue(cards).bust) break;
  }
}

function dealRound() {
  if (!play?.active || play.busy) return;
  ensureShoe();
  const bet = Math.min(play.bankroll, Math.max(1, Number($('#playBet').value) || settings.unit));
  if (bet <= 0) return;
  play.round += 1; play.bet = bet; play.dealer = []; play.playerHands = [{ cards: [], bet, afterSplit: false, doubled: false, surrendered: false }]; play.currentHand = 0; play.autoHands = Array.from({ length: settings.automatedSeats }, () => []); play.dealerRevealed = false;
  const allHands = [...play.autoHands, play.playerHands[0].cards];
  allHands.forEach((cards) => visibleDraw(cards));
  visibleDraw(play.dealer);
  allHands.forEach((cards) => visibleDraw(cards));
  if (play.rules.holeCard === 'us') play.dealer.push(drawCard(play.shoe));
  play.autoHands.forEach((cards) => autoplaySeat(cards, play.dealer[0]));
  renderPlay();
  $('#dealRound').disabled = true;
  if (play.rules.insurance && play.dealer[0].rank === 'A') {
    $('#insuranceControls').hidden = false; setDecisionButtons(false);
    $('#playFeedback').textContent = 'Insurance is available. Take it or decline before playing the hand.'; return;
  }
  if (play.rules.holeCard === 'us' && isBlackjack(play.dealer)) { revealDealer(); finishRound(); return; }
  if (isBlackjack(play.playerHands[0].cards)) { revealDealer(); finishRound(); return; }
  setDecisionButtons(true);
  $('#playFeedback').textContent = 'Choose the best action for your hand.';
}

function scoreDecision(action, hand) {
  const count = trueCount(play.runningCount, play.shoe.length);
  const expected = perfectAction(hand.cards, play.dealer[0], count, play.rules, settings.trackDeviations, { allowSplit: true, afterSplit: hand.afterSplit });
  const base = basicStrategy(hand.cards, play.dealer[0], play.rules, { afterSplit: hand.afterSplit });
  const correct = action === expected.action;
  if (settings.trackStrategy || settings.trackDeviations) {
    play.decisions += 1; if (correct) play.correctDecisions += 1;
    play.strategyStreak = correct ? play.strategyStreak + 1 : 0;
    play.bestStrategyStreak = Math.max(play.bestStrategyStreak, play.strategyStreak);
    if (expected.deviation) { play.deviationOpportunities += 1; if (correct) play.correctDeviations += 1; }
    play.accuracySeries.push(play.correctDecisions / play.decisions * 100);
  }
  const source = expected.deviation ? `Deviation (${expected.deviation.label})` : 'Basic Strategy';
  const feedback = $('#playFeedback'); feedback.className = `feedback ${correct ? 'is-correct' : 'is-wrong'}`;
  feedback.textContent = correct ? `Correct — ${source}: ${expected.action}.` : `Not quite — ${source} calls for ${expected.action}, not ${action}. Base play: ${base}.`;
  return correct;
}

function handleDecision(action) {
  if (!play?.active) return;
  const hand = play.playerHands[play.currentHand];
  scoreDecision(action, hand);
  if (action === 'hit') { visibleDraw(hand.cards); if (handValue(hand.cards).total < 21) { renderPlay(); setDecisionButtons(true); return; } }
  if (action === 'double') { hand.doubled = true; visibleDraw(hand.cards); }
  if (action === 'surrender') hand.surrendered = true;
  if (action === 'split') {
    const secondCard = hand.cards.pop();
    const splitAces = hand.cards[0].rank === 'A';
    const first = { cards: [hand.cards[0]], bet: hand.bet, afterSplit: true, splitAce: splitAces, doubled: false, surrendered: false };
    const second = { cards: [secondCard], bet: hand.bet, afterSplit: true, splitAce: splitAces, doubled: false, surrendered: false };
    visibleDraw(first.cards); visibleDraw(second.cards); play.playerHands.splice(play.currentHand, 1, first, second);
    if (splitAces && !play.rules.hitSplitAces) {
      const firstCanResplit = play.rules.resplitAces && canSplit(first.cards) && play.playerHands.length < play.rules.maxSplitHands;
      const secondCanResplit = play.rules.resplitAces && canSplit(second.cards) && play.playerHands.length < play.rules.maxSplitHands;
      if (!firstCanResplit && !secondCanResplit) {
        const nextAcePair = play.playerHands.findIndex((candidate, index) => index > play.currentHand && candidate.splitAce && canSplit(candidate.cards) && play.playerHands.length < play.rules.maxSplitHands);
        if (nextAcePair >= 0) { play.currentHand = nextAcePair; renderPlay(); setDecisionButtons(true); return; }
        play.currentHand = play.playerHands.length; renderPlay(); revealDealer(); finishRound(); return;
      }
      if (!firstCanResplit && secondCanResplit) play.currentHand += 1;
    }
    renderPlay(); setDecisionButtons(true); return;
  }
  play.currentHand += 1;
  if (play.currentHand < play.playerHands.length) { renderPlay(); setDecisionButtons(true); return; }
  revealDealer(); finishRound();
}

function revealDealer() {
  if (!play.dealer[1]) play.dealer.push(drawCard(play.shoe));
  if (!play.dealerRevealed && play.dealer[1]) revealToCount(play.dealer[1]);
  if (play.rules.holeCard === 'enhc' && play.insuranceTaken) play.insuranceResult = isBlackjack(play.dealer) ? play.bet : -play.bet / 2;
  play.dealerRevealed = true;
  if (!isBlackjack(play.dealer) && play.playerHands.some((hand) => !hand.surrendered && !handValue(hand.cards).bust)) playDealer(play.dealer, play.shoe, play.rules, revealToCount);
}

function finishRound() {
  setDecisionButtons(false);
  let net = 0;
  play.playerHands.forEach((hand) => { net += settleHand(hand.cards, play.dealer, hand.bet, play.rules, hand.surrendered, hand.doubled, hand.afterSplit); });
  net += play.insuranceResult || 0; play.insuranceResult = 0; play.insuranceTaken = false;
  play.bankroll += net; play.roundResults.push(net);
  renderPlay(); $('#dealRound').disabled = play.bankroll < 1;
  $('#playFeedback').textContent += ` Round result: ${net >= 0 ? '+' : ''}$${net.toFixed(2)}.`;
  if (settings.trackCounting && play.round % (2 + Math.floor(Math.random() * 3)) === 0) $('#countDialog').showModal();
  renderSession();
}

function endSession() {
  if (!play?.active) return;
  play.active = false; play.endedAt = new Date().toISOString();
  const record = { ...play, shoe: undefined, dealer: undefined, playerHands: undefined, autoHands: undefined, accuracy: play.decisions ? play.correctDecisions / play.decisions * 100 : 0 };
  data.sessions = appendLimited(data.sessions, record);
  const unlocked = checkSessionAchievements(data, record); persist(); unlocked.forEach(announceAchievement);
  $('#startSession').disabled = false; $('#dealRound').disabled = true; $('#endSession').disabled = true; setDecisionButtons(false); syncSettingsUI();
  $('#playFeedback').textContent = `Session saved: ${play.round} rounds, ${record.accuracy.toFixed(1)}% decision accuracy.`;
}

$('#startSession').addEventListener('click', startSession); $('#dealRound').addEventListener('click', dealRound); $('#endSession').addEventListener('click', endSession);
$$('[data-action]').forEach((button) => button.addEventListener('click', () => handleDecision(button.dataset.action)));
function resolveInsurance(take) {
  $('#insuranceControls').hidden = true;
  const dealerBlackjack = play.rules.holeCard === 'us' && isBlackjack(play.dealer);
  play.insuranceTaken = take;
  play.insuranceResult = take && play.rules.holeCard === 'us' ? (dealerBlackjack ? play.bet : -play.bet / 2) : 0;
  const count = trueCount(play.runningCount, play.shoe.length);
  const correct = take === (count >= 3);
  play.deviationOpportunities += 1; if (correct) play.correctDeviations += 1;
  $('#playFeedback').textContent = `${correct ? 'Correct' : 'Review'} — insurance is the Hi-Lo index play at TC +3 or higher.`;
  if (dealerBlackjack) { revealDealer(); finishRound(); return; }
  if (isBlackjack(play.playerHands[0].cards)) { revealDealer(); finishRound(); return; }
  setDecisionButtons(true);
}
$('#takeInsurance').addEventListener('click', () => resolveInsurance(true));
$('#declineInsurance').addEventListener('click', () => resolveInsurance(false));
$('#countForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget); const running = Number(form.get('running')); const actualTrue = trueCount(play.runningCount, play.shoe.length); const submittedTrue = Number(form.get('true'));
  const correct = running === play.runningCount && submittedTrue === actualTrue;
  play.countStreak = correct ? play.countStreak + 1 : 0; play.bestCountStreak = Math.max(play.bestCountStreak, play.countStreak);
  $('#countDialog').close(); $('#playFeedback').className = `feedback ${correct ? 'is-correct' : 'is-wrong'}`;
  $('#playFeedback').textContent = `${correct ? 'Count locked.' : 'Count corrected.'} Running count ${play.runningCount}; true count ${actualTrue}.`;
  event.currentTarget.reset();
});

function randomDrill() {
  const shoe = shuffle(createShoe(1));
  if (drillMode === 'deviation') {
    const item = DEVIATIONS[Math.floor(Math.random() * DEVIATIONS.length)];
    const ranksForTotal = item.total >= 12 ? [String(item.total - 10), '10'] : [String(Math.max(2, item.total - 2)), '2'];
    const make = (rank) => ({ rank: rank === '11' ? 'A' : rank, suit: '♠' });
    drill = { player: ranksForTotal.map(make), dealer: make(item.dealer === 11 ? 'A' : String(item.dealer)), count: item.index + (item.below ? -1 : 0), expected: item.action, deviation: item };
  } else {
    const player = [shoe.pop(), shoe.pop()]; const dealer = shoe.pop();
    drill = { player, dealer, count: 0, expected: basicStrategy(player, dealer, settings.rules) };
  }
  $('#drillDealer').innerHTML = cardMarkup(drill.dealer); $('#drillPlayer').innerHTML = drill.player.map((card) => cardMarkup(card)).join('');
  $('#drillCount').textContent = drillMode === 'deviation' ? `True count ${drill.count >= 0 ? '+' : ''}${drill.count}` : 'Base strategy';
  $('#drillFeedback').className = 'feedback'; $('#drillFeedback').textContent = 'Choose the best play.';
}

$$('[data-drill-mode]').forEach((button) => button.addEventListener('click', () => { drillMode = button.dataset.drillMode; $$('[data-drill-mode]').forEach((item) => item.classList.toggle('is-active', item === button)); randomDrill(); }));
$$('[data-drill-action]').forEach((button) => button.addEventListener('click', () => {
  const correct = button.dataset.drillAction === drill.expected;
  $('#drillFeedback').className = `feedback ${correct ? 'is-correct' : 'is-wrong'}`;
  $('#drillFeedback').textContent = correct ? `Correct — ${drill.expected}.` : `The correct play is ${drill.expected}.`;
}));
$('#nextDrill').addEventListener('click', randomDrill); randomDrill();

function stopVisualTimers() { if (!visual) return; clearTimeout(visual.timer); clearInterval(visual.countTimer); }
function startVisual() {
  stopVisualTimers();
  const decks = Number($('#visualDecks').value); const groupSize = Number($('#visualGroup').value); const speed = Number($('#visualSpeed').value);
  const shoe = shuffle(createShoe(decks)); const penetration = 65 + Math.floor(Math.random() * 21); const cardsToShow = Math.floor(shoe.length * penetration / 100 / groupSize) * groupSize;
  visual = { id: crypto.randomUUID(), decks, groupSize, speed, shoe: shoe.slice(0, cardsToShow), index: 0, count: 0, penetration, paused: false, everPaused: false, startedAt: Date.now() };
  $('#visualSetup').hidden = true; $('#visualArena').hidden = false; $('#visualAnswer').hidden = true; $('#visualResult').textContent = ''; $('#visualCards').innerHTML = '';
  let number = 3; $('#visualCountdown').textContent = number;
  visual.countTimer = setInterval(() => { number -= 1; $('#visualCountdown').textContent = number > 0 ? number : ''; if (number <= 0) { clearInterval(visual.countTimer); showVisualGroup(); } }, 700);
}
function showVisualGroup() {
  if (!visual || visual.paused) return;
  if (visual.index >= visual.shoe.length) { finishVisual(); return; }
  const group = visual.shoe.slice(visual.index, visual.index + visual.groupSize); visual.index += group.length; group.forEach((card) => { visual.count += hiLoValue(card); });
  $('#visualCards').innerHTML = group.map((card) => cardMarkup(card)).join(''); $('#visualProgress').textContent = `${visual.index} cards seen`;
  visual.timer = setTimeout(showVisualGroup, 1000 / visual.speed);
}
function finishVisual() { stopVisualTimers(); $('#visualCards').innerHTML = ''; $('#visualProgress').textContent = 'Shoe complete. Lock in the count.'; $('#visualAnswer').hidden = false; $('#visualCountInput').focus(); }
$('#startVisual').addEventListener('click', startVisual); $('#restartVisual').addEventListener('click', () => { $('#visualSetup').hidden = false; $('#visualArena').hidden = true; $('#visualAnswer').hidden = true; stopVisualTimers(); });
$('#pauseVisual').addEventListener('click', () => { if (!visual) return; visual.paused = !visual.paused; visual.everPaused = true; $('#pauseVisual').textContent = visual.paused ? 'Resume' : 'Pause'; if (!visual.paused) showVisualGroup(); });
$('#visualAnswer').addEventListener('submit', (event) => {
  event.preventDefault(); const answer = Number($('#visualCountInput').value); const correct = answer === visual.count;
  const attempt = { ...visual, shoe: undefined, correct, submitted: answer, actual: visual.count, error: Math.abs(answer - visual.count), paused: visual.everPaused, duration: Date.now() - visual.startedAt, completedAt: new Date().toISOString() };
  data.visualAttempts = appendLimited(data.visualAttempts, attempt); const unlocked = checkVisualAchievement(data, attempt); persist(); announceAchievement(unlocked);
  $('#visualResult').className = `feedback ${correct ? 'is-correct' : 'is-wrong'}`; $('#visualResult').textContent = `${correct ? 'Perfect count.' : 'Count missed.'} You entered ${answer}; actual running count ${visual.count}; error ${attempt.error}.`;
  $('#visualAnswer').hidden = true; $('#visualSetup').hidden = false; renderHistory();
});

function simulationConfig() {
  return { rules: structuredClone(settings.rules), betSpread: structuredClone(settings.betSpread), deviations: $('#simDeviations').checked, unit: Number($('#simUnit').value), handsPerHour: Number($('#simHandsHour').value) };
}
function createWorker() {
  simWorker?.terminate(); simWorker = new Worker(new URL('./simulation-worker.js', import.meta.url), { type: 'module' });
  simWorker.addEventListener('message', (event) => {
    if (event.data.type === 'progress') { simSnapshot = event.data.payload; renderSimulation(simSnapshot); }
    if (event.data.type === 'paused') { simSnapshot = event.data.payload; renderSimulation(simSnapshot); }
  });
}
function runSimulation() {
  if (simStatus === 'paused') { simWorker.postMessage({ type: 'resume' }); simStatus = 'running'; }
  else if (simStatus === 'idle') { createWorker(); simWorker.postMessage({ type: 'speed', speed: $('#simSpeed').value }); simWorker.postMessage({ type: 'start', config: simulationConfig(), seed: Date.now() }); simStatus = 'running'; }
  $('#simRun').disabled = true; $('#simStop').disabled = false; $('#simRestart').disabled = false; syncSettingsUI();
}
function stopSimulation() { if (simStatus !== 'running') return; simWorker.postMessage({ type: 'pause' }); simStatus = 'paused'; $('#simRun').disabled = false; $('#simStop').disabled = true; syncSettingsUI(); saveSimulation(); }
function saveSimulation() {
  if (!simSnapshot?.hands) return;
  const record = { id: crypto.randomUUID(), completedAt: new Date().toISOString(), config: simulationConfig(), ...simSnapshot, trace: undefined };
  data.simulations = appendLimited(data.simulations.filter((item) => item.seed !== record.seed), record, 40); persist();
}
function restartSimulation() { saveSimulation(); simWorker?.terminate(); simStatus = 'idle'; simSnapshot = null; $('#simRun').disabled = false; $('#simStop').disabled = true; $('#simRestart').disabled = true; renderSimulation(null); syncSettingsUI(); }
$('#simRun').addEventListener('click', runSimulation); $('#simStop').addEventListener('click', stopSimulation); $('#simRestart').addEventListener('click', restartSimulation); $('#simSpeed').addEventListener('change', () => simWorker?.postMessage({ type: 'speed', speed: $('#simSpeed').value }));

function renderSimulation(result) {
  if (!result) {
    $('#simEv').textContent = '0.00 units / 100'; $('#simEvDollars').textContent = '$0.00/hour · Run to begin'; $('#simHands').textContent = '0'; $('#simProfit').textContent = '0.00 u'; $('#simCi').textContent = '±0.00'; $('#simAvgBet').textContent = '0.00 u'; $('#simDealer').innerHTML = ''; $('#simPlayer').innerHTML = ''; $('#simBotHud').textContent = 'Waiting for a run.'; renderLineChart($('#evChart'), [], 'EV convergence'); return;
  }
  const dollarsHour = result.ev100 / 100 * Number($('#simHandsHour').value) * Number($('#simUnit').value);
  $('#simEv').textContent = `${result.ev100.toFixed(2)} units / 100`;
  $('#simEvDollars').textContent = `${dollarsHour >= 0 ? '+' : '-'}$${Math.abs(dollarsHour).toFixed(2)}/hour · ${result.hands < 10000 ? 'Provisional sample' : '95% confidence shown'}`;
  $('#simHands').textContent = result.hands.toLocaleString(); $('#simProfit').textContent = `${result.profit.toFixed(2)} u`; $('#simCi').textContent = `±${result.margin.toFixed(2)}`; $('#simAvgBet').textContent = `${result.averageBet.toFixed(2)} u`;
  if (result.trace) {
    $('#simDealer').innerHTML = result.trace.dealer.map((card) => cardMarkup(card)).join('');
    $('#simPlayer').innerHTML = (result.trace.playerHands?.[0] || result.trace.player).map((card) => cardMarkup(card)).join('');
    $('#simBotHud').textContent = `RC ${result.trace.runningCount} · TC ${result.trace.trueCount >= 0 ? '+' : ''}${result.trace.trueCount} · Bet ${result.trace.bet}u · ${result.trace.reason}`;
  }
  const evHistory = result.history.map((profit, index) => profit / Math.max(1, (index + 1) * result.hands / result.history.length) * 100);
  renderLineChart($('#evChart'), evHistory, 'Estimated EV convergence', 'units per 100 hands');
  renderBars($('#evByCountChart'), Object.keys(result.counts).sort((a, b) => Number(a) - Number(b)).map((key) => ({ label: key, value: result.evByCount[key] / result.counts[key] * 100 })), 'EV by true count');
}

function renderSession() {
  const stats = $('#sessionStats');
  if (!play) { stats.innerHTML = '<p class="empty-state">Start a table session to see live performance.</p>'; renderLineChart($('#sessionChart'), [], 'Decision accuracy'); return; }
  const accuracy = play.decisions ? play.correctDecisions / play.decisions * 100 : 0;
  stats.innerHTML = `<div><span>Rounds</span><strong>${play.round}</strong></div><div><span>Decision accuracy</span><strong>${accuracy.toFixed(1)}%</strong></div><div><span>Best streak</span><strong>${play.bestStrategyStreak}</strong></div><div><span>Net result</span><strong>$${(play.bankroll - settings.bankroll).toFixed(2)}</strong></div>`;
  renderLineChart($('#sessionChart'), play.accuracySeries, 'Decision accuracy', 'percent');
}

function renderHistory() {
  $('#achievementGrid').innerHTML = ACHIEVEMENTS.map((item) => { const state = data.achievements[item.id]; return `<article class="achievement${state ? '' : ' is-locked'}"><span class="medal">${state ? '◆' : '◇'}</span><h3>${item.name}</h3><p>${item.description}</p><small>${state ? new Date(state.unlockedAt).toLocaleDateString() : 'Locked'}</small></article>`; }).join('');
  renderLineChart($('#historyChart'), data.visualAttempts.map((attempt) => attempt.error), 'Visual Count absolute error', 'cards');
  const entries = [
    ...data.sessions.map((item) => ({ date: item.endedAt, title: `Table session · ${item.round} rounds`, detail: `${(item.accuracy || 0).toFixed(1)}% accuracy` })),
    ...data.visualAttempts.map((item) => ({ date: item.completedAt, title: `Visual Count · ${item.decks}D at ${item.speed}×`, detail: item.correct ? 'Perfect count' : `Error ${item.error}` })),
    ...data.simulations.map((item) => ({ date: item.completedAt, title: `Perfect Play · ${item.hands.toLocaleString()} hands`, detail: `${item.ev100.toFixed(2)} units / 100` })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 30);
  $('#historyList').innerHTML = entries.length ? entries.map((entry) => `<article class="history-item"><div><strong>${entry.title}</strong><small>${new Date(entry.date).toLocaleString()}</small></div><span>${entry.detail}</span></article>`).join('') : '<p class="empty-state">Your completed training appears here.</p>';
}
$('#resetData').addEventListener('click', () => { if (!confirm('Reset every saved session, simulation, setting, and achievement?')) return; localStorage.removeItem('advantagePlayBJ.v1'); data = loadData(); settings = data.settings; syncSettingsUI(); renderHistory(); });

syncSettingsUI(); renderSession(); renderHistory(); renderSimulation(null);
const requestedTab = location.hash.slice(1); if (['play', 'drills', 'visual', 'simulation', 'session', 'history', 'settings'].includes(requestedTab)) setTab(requestedTab);
