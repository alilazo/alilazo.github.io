import { STORAGE_KEY, normalizeSettings } from './config.js';

function emptyData() {
  return { version: 1, settings: normalizeSettings(), sessions: [], visualAttempts: [], simulations: [], achievements: {} };
}

export function loadData(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== 1) return emptyData();
    return {
      ...emptyData(),
      ...parsed,
      settings: normalizeSettings(parsed.settings),
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      visualAttempts: Array.isArray(parsed.visualAttempts) ? parsed.visualAttempts : [],
      simulations: Array.isArray(parsed.simulations) ? parsed.simulations : [],
      achievements: parsed.achievements && typeof parsed.achievements === 'object' ? parsed.achievements : {},
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 1 }));
}

export function appendLimited(items, value, limit = 100) {
  return [...items, value].slice(-limit);
}
