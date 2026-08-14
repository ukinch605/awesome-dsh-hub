import test from 'node:test';
import assert from 'node:assert/strict';
import { activityLevel } from '../lib/activity.js';

const now = Date.parse('2026-08-14T00:00:00Z');
const daysAgo = (d) => new Date(now - d * 86_400_000).toISOString();

test('activityLevel: <30 days is active', () => {
  assert.equal(activityLevel(daysAgo(10), now), 'active');
  assert.equal(activityLevel(daysAgo(29), now), 'active');
});

test('activityLevel: 30-89 days is watching', () => {
  assert.equal(activityLevel(daysAgo(30), now), 'watching');
  assert.equal(activityLevel(daysAgo(89), now), 'watching');
});

test('activityLevel: 90-364 days is slowing', () => {
  assert.equal(activityLevel(daysAgo(90), now), 'slowing');
  assert.equal(activityLevel(daysAgo(364), now), 'slowing');
});

test('activityLevel: >=365 days is stale', () => {
  assert.equal(activityLevel(daysAgo(365), now), 'stale');
  assert.equal(activityLevel(daysAgo(800), now), 'stale');
});

test('activityLevel: missing/invalid date is stale', () => {
  assert.equal(activityLevel(null, now), 'stale');
  assert.equal(activityLevel('not-a-date', now), 'stale');
});
