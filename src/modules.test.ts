import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, moduleFromHash, DEFAULT_MODULE } from './modules';

test('Module registry: ten unique modules numbered 01-10 in course order', () => {
  assert.equal(MODULES.length, 10);
  assert.deepEqual(
    MODULES.map((m) => m.number),
    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
  );
  assert.equal(new Set(MODULES.map((m) => m.id)).size, 10);
  assert.deepEqual(
    MODULES.map((m) => m.id),
    [
      'wafer',
      'atomic',
      'equilibrium',
      'transport',
      'fabrication',
      'junction',
      'diode',
      'mos',
      'photonics',
      'bench',
    ],
  );
});

test('Hash routing keeps existing links working and falls back safely', () => {
  for (const m of MODULES) assert.equal(moduleFromHash(`#${m.id}`), m.id);
  assert.equal(moduleFromHash('#atomic-well'), 'atomic');
  assert.equal(moduleFromHash(''), DEFAULT_MODULE);
  assert.equal(moduleFromHash('#nonsense'), DEFAULT_MODULE);
});
