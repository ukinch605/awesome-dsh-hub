import test from 'node:test';
import assert from 'node:assert/strict';
import { alertMarker } from '../notify-failure.js';

test('alert markers are isolated per workflow', () => {
  assert.equal(alertMarker('Update Registry'), '[dsh-hub:Update-Registry]');
  assert.equal(alertMarker('Compatibility Matrix'), '[dsh-hub:Compatibility-Matrix]');
  assert.notEqual(alertMarker('Update Registry'), alertMarker('Compatibility Matrix'));
});
