import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, STAGES, moduleFromHash, DEFAULT_MODULE } from './modules';
import { LESSONS, COURSE_PATHS } from './lessons';

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
  assert.equal(moduleFromHash('#home'), 'home');
});

test('Every module has a complete lesson guide that points at real modules', () => {
  const ids = new Set(MODULES.map((m) => m.id));
  for (const m of MODULES) {
    assert.ok(
      STAGES.some((s) => s.id === m.stage),
      m.id,
    );
    const l = LESSONS[m.id];
    assert.ok(l, `lesson for ${m.id}`);
    assert.equal(l.goals.length, 3, m.id);
    assert.ok(
      l.check.length >= 2 && l.sections.length >= 3 && l.minutes > 0 && l.demo.length > 40,
      m.id,
    );
    for (const b of l.buildsOn) assert.ok(ids.has(b) && b !== m.id, `${m.id} builds on ${b}`);
    for (const s of l.sections)
      assert.equal([s.heading, s.summary, s.selector].filter(Boolean).length, 1, s.label);
  }
  for (const p of COURSE_PATHS) for (const id of p.modules) assert.ok(ids.has(id), id);
});
