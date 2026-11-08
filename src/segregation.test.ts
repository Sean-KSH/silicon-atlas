import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solid, liquid, inventory, average, balance } from './segregation.ts';
const near = (a: number, b: number, tol = 1e-10) =>
  assert.ok(Math.abs(a - b) < tol * Math.max(Math.abs(b), 1e-30), `${a} ≠ ${b}`);
test('k=1: uniform solid, liquid and retained average', () => {
  for (const f of [0, 0.2, 0.8, 0.999]) {
    near(solid(1e-7, 1, f), 1e-7);
    near(liquid(1e-7, 1, f), 1e-7);
  }
  near(average(1e-7, 1, 0.2, 0.95), 1e-7);
});
test('Finite-interval mass balance, 16 cases', () => {
  for (const k of [0.01, 0.1, 1, 2])
    for (const f of [0.1, 0.5, 0.9, 0.999]) {
      assert.ok(Math.abs(balance(1e-7, k, f).residual) < 1e-13);
      near(inventory(1e-7, k, 0, f) + (1 - f) * liquid(1e-7, k, f), 1e-7);
    }
});
test('Integrated interval matches independent midpoint quadrature, refined grid', () => {
  for (const k of [0.1, 1, 2]) {
    const a = 0.12,
      b = 0.97,
      c = 1e-7,
      exact = inventory(c, k, a, b);
    const quad = (n: number) =>
      Array.from(
        { length: n },
        (_, i) => (solid(c, k, a + ((i + 0.5) * (b - a)) / n) * (b - a)) / n,
      ).reduce((x, y) => x + y, 0);
    const coarse = quad(1000),
      fine = quad(2000);
    near(fine, exact, 2e-6);
    if (k === 0.1) assert.ok(Math.abs(fine - exact) < Math.abs(coarse - exact) / 3.9);
  }
});
test('Partition ratio, trend reversal, interval additivity, concentration scaling', () => {
  for (const k of [0.1, 1, 2]) {
    near(solid(1e-7, k, 0.4) / liquid(1e-7, k, 0.4), k);
    near(inventory(1e-7, k, 0.1, 0.8), inventory(1e-7, k, 0.1, 0.4) + inventory(1e-7, k, 0.4, 0.8));
    near(average(2e-7, k, 0.1, 0.8), 2 * average(1e-7, k, 0.1, 0.8));
  }
  assert.ok(solid(1e-7, 0.1, 0.8) > solid(1e-7, 0.1, 0));
  assert.ok(solid(1e-7, 2, 0.8) < solid(1e-7, 2, 0));
});
test('Reject endpoint, invalid segment, nonphysical inputs', () => {
  assert.throws(() => solid(1e-7, 0.1, 1));
  assert.throws(() => average(1e-7, 0.1, 0.8, 0.2));
  assert.throws(() => solid(1e-7, 0, 0.5));
  assert.throws(() => solid(NaN, 1, 0.5));
});
