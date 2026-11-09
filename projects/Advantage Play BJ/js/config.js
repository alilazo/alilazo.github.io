export const STORAGE_KEY = 'advantagePlayBJ.v1';

export const DEFAULT_RULES = Object.freeze({
  decks: 6,
  penetration: 75,
  soft17: 'stand',
  blackjackPayout: 1.5,
  holeCard: 'us',
  doubleRule: 'any',
  doubleAfterSplit: true,
  surrender: 'late',
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
  insurance: true,
});

export const DEFAULT_SETTINGS = Object.freeze({
  rules: DEFAULT_RULES,
  automatedSeats: 0,
  bankroll: 1000,
  unit: 10,
  handsPerHour: 100,
  trackCounting: true,
  trackStrategy: true,
  trackDeviations: true,
  trackBetting: false,
  betSpread: { min: 1, tc1: 2, tc2: 4, tc3: 6, tc4: 8 },
});

export const ACHIEVEMENTS = Object.freeze([
  { id: 'first-session', name: 'Welcome to the Felt', description: 'Complete your first saved session.' },
  { id: 'basic-instinct', name: 'Basic Instinct', description: 'Make 25 correct Basic Strategy decisions in a row.' },
  { id: 'running-true', name: 'Running True', description: 'Nail five consecutive running and true count checkpoints.' },
  { id: 'index-player', name: 'Index Player', description: 'Complete ten deviation opportunities correctly in one session.' },
  { id: 'flash-focus', name: 'Flash Focus', description: 'Finish an unpaused 2x, two-card Visual Count drill perfectly.' },
]);

export function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

export function normalizeSettings(value = {}) {
  const defaults = cloneDefaults();
  const sourceRules = value.rules || {};
  const rules = { ...defaults.rules, ...sourceRules };
  const allowedDecks = [1, 2, 4, 6, 8];
  if (!allowedDecks.includes(Number(rules.decks))) rules.decks = defaults.rules.decks;
  rules.decks = Number(rules.decks);
  rules.penetration = Math.min(90, Math.max(50, Number(rules.penetration) || 75));
  rules.maxSplitHands = Math.min(4, Math.max(2, Number(rules.maxSplitHands) || 4));
  rules.blackjackPayout = Number(rules.blackjackPayout) === 1.2 ? 1.2 : 1.5;
  return {
    ...defaults,
    ...value,
    rules,
    betSpread: { ...defaults.betSpread, ...(value.betSpread || {}) },
    automatedSeats: Math.min(5, Math.max(0, Number(value.automatedSeats) || 0)),
    bankroll: Math.max(1, Number(value.bankroll) || defaults.bankroll),
    unit: Math.max(1, Number(value.unit) || defaults.unit),
    handsPerHour: Math.min(300, Math.max(10, Number(value.handsPerHour) || defaults.handsPerHour)),
  };
}

export function rulesSummary(rules) {
  return `${rules.decks}D · ${rules.soft17 === 'hit' ? 'H17' : 'S17'} · ${rules.doubleAfterSplit ? 'DAS' : 'NDAS'} · ${rules.surrender === 'late' ? 'LS' : 'No surrender'} · ${rules.blackjackPayout === 1.5 ? '3:2' : '6:5'}`;
}
