import { ACTIVITY_LEVELS } from './constants.js';

export function activityLevel(pushedAt, now = Date.now()) {
  if (!pushedAt) return 'stale';
  const days = Math.floor((now - Date.parse(pushedAt)) / 86_400_000);
  if (Number.isNaN(days)) return 'stale';
  const level = ACTIVITY_LEVELS.find((a) => days < a.maxDays);
  return level ? level.id : 'stale';
}
