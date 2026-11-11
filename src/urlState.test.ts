import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal browser globals for the URL helpers.
const g = globalThis as unknown as { location: { hash: string } };
g.location = { hash: '' };
const { initialFromLink } = await import('./urlState');

test('Linked settings: link values override defaults with the right types', () => {
  g.location.hash = '#junction?na=1e23&voltage=-3&mode=pb&on=false';
  assert.deepEqual(initialFromLink('', { na: 1e22, nd: 1e21, voltage: 0 }), {
    na: 1e23,
    nd: 1e21,
    voltage: -3,
  });
  assert.equal(initialFromLink('mode', 'depletion'), 'pb');
  assert.equal(initialFromLink('on', true), false);
});

test('Linked settings: malformed or missing values fall back to defaults', () => {
  g.location.hash = '#junction?na=abc&voltage=&flag=maybe';
  assert.deepEqual(initialFromLink('', { na: 1e22, voltage: 0 }), { na: 1e22, voltage: 0 });
  assert.equal(initialFromLink('flag', true), true);
  g.location.hash = '#junction';
  assert.equal(initialFromLink('cells', 160), 160);
});

test('Linked settings: prefixes keep two objects apart', () => {
  g.location.hash = '#photonics?wavelength=8.5e-7&led.current=0.02';
  assert.deepEqual(initialFromLink('', { wavelength: 6.5e-7 }), { wavelength: 8.5e-7 });
  assert.deepEqual(initialFromLink('led.', { current: 0.01 }), { current: 0.02 });
});
