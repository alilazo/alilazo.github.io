import { ACHIEVEMENTS } from './config.js';

export function unlock(data, id, sourceId = null) {
  if (data.achievements[id]) return null;
  const definition = ACHIEVEMENTS.find((item) => item.id === id);
  if (!definition) return null;
  data.achievements[id] = { unlockedAt: new Date().toISOString(), sourceId };
  return definition;
}

export function checkSessionAchievements(data, session) {
  const unlocked = [];
  const attempt = (id) => {
    const item = unlock(data, id, session.id);
    if (item) unlocked.push(item);
  };
  if (data.sessions.length >= 1) attempt('first-session');
  if ((session.bestStrategyStreak || 0) >= 25) attempt('basic-instinct');
  if ((session.bestCountStreak || 0) >= 5) attempt('running-true');
  if ((session.correctDeviations || 0) >= 10) attempt('index-player');
  return unlocked;
}

export function checkVisualAchievement(data, attempt) {
  if (attempt.correct && !attempt.paused && attempt.speed >= 2 && attempt.groupSize >= 2 && attempt.decks >= 1) {
    return unlock(data, 'flash-focus', attempt.id);
  }
  return null;
}
