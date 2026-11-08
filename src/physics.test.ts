import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, at, q, eps, csv } from './physics.ts';
const close = (a: number, b: number, tol = 1e-10) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-30), `${a} vs ${b}`);
const base = { na: 1e22, nd: 1e21, va: 0 };
test('Neamen examples 7.1, 7.2, 7.3, 7.5 (rounded references, 0.4%)', () => {
  let s = solve(base);
  close(s.vbi, 0.635, 0.004);
  close(s.w, 0.951e-6, 0.004);
  close(s.peak, -1.34e6, 0.004);
  s = solve({ ...base, va: -5 });
  close(s.w, 2.83e-6, 0.004);
  close(s.cap, 3.66e-5, 0.004);
});
test('Charge neutrality, boundary fields, potential, field-energy signs across control grid', () => {
  for (const na of [1e20, 1e21, 1e22, 1e23])
    for (const nd of [1e20, 1e21, 1e22, 1e23])
      for (const va of [-5, 0, 0.4]) {
        const s = solve({ na, nd, va });
        close(na * s.xp, nd * s.xn);
        close(at(s, -s.xp).field, 0);
        close(at(s, s.xn).potential, s.barrier);
        close(at(s, 0).field, s.peak);
        close((-s.peak * s.w) / 2, s.barrier);
        close(at(s, 0).energy, -q * at(s, 0).potential);
      }
});
test('Symmetry and reverse bias scaling', () => {
  const s = solve({ na: 1e22, nd: 1e22, va: 0 });
  close(s.xp, s.xn);
  const r = solve({ ...base, va: -5 }),
    z = solve(base);
  assert.ok(r.w > z.w && r.cap < z.cap);
  close(r.w / z.w, Math.sqrt(r.barrier / z.barrier));
});
test('Independent finite-difference dQ/dVR = capacitance; Poisson and E=-dphi/dx', () => {
  const s = solve(base),
    h = 1e-5;
  const plus = solve({ ...base, va: -h }),
    minus = solve({ ...base, va: h });
  close((q * base.nd * (plus.xn - minus.xn)) / (2 * h), s.cap, 1e-7);
  const x = -s.xp / 2,
    dx = s.xp * 1e-4;
  close(-(at(s, x + dx).potential - at(s, x - dx).potential) / (2 * dx), at(s, x).field, 1e-8);
  close((at(s, x + dx).field - at(s, x - dx).field) / (2 * dx), at(s, x).rho / eps, 1e-8);
});
test('Invalid inputs exposed and CSV retains SI labels', () => {
  assert.throws(() => solve({ ...base, na: NaN }));
  assert.throws(() => solve({ ...base, va: 1 }));
  assert.ok(csv(solve(base)).includes('electron_energy_J'));
});
