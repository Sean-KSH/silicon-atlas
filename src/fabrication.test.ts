import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaults,
  oxideGrowth,
  oxideRates,
  diffusivity,
  concentration,
  profileDose,
  junctionDepth,
  aerial,
  simulateRecipe,
  inspect,
  exportRecipe,
  etchOxide,
  width,
  height,
} from './fabrication';
const close = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-30), `${a} differs from ${b}`);
test('Deal–Grove initial condition, growth equation, composition and analytical limits', () => {
  for (const wet of [true, false])
    for (const T of [1173.15, 1273.15, 1373.15]) {
      const { A, B, linear } = oxideRates(T, wet);
      close(oxideGrowth(1e-7, 0, T, wet), 1e-7);
      for (const t of [60, 3600, 18000]) {
        const x = oxideGrowth(1e-7, t, T, wet);
        close(x * x + A * x, 1e-14 + A * 1e-7 + B * t);
        close(oxideGrowth(oxideGrowth(0, t, T, wet), t, T, wet), oxideGrowth(0, 2 * t, T, wet));
      }
      const short = (1e-6 * A * A) / B,
        long = (1e8 * A * A) / B;
      close(oxideGrowth(0, short, T, wet), linear * short, 2e-6);
      close(oxideGrowth(0, long, T, wet), Math.sqrt(B * long), 1e-4);
    }
  assert.throws(() => oxideGrowth(0, -1, 1273.15, true));
  assert.throws(() => oxideRates(800, true));
});
test('Independent reference diffusivity and oxide coefficients; temperature trends', () => {
  close(diffusivity(1273.15), 2.64e-18, 0.02);
  const { B, linear } = oxideRates(1273.15, false);
  close(B, 2.144e-13 * Math.exp(-14270 / 1273.15));
  close(linear, (0.00173 / 1.68) * Math.exp(-23200 / 1273.15));
  assert.ok(oxideGrowth(0, 3600, 1373.15, true) > oxideGrowth(0, 3600, 1273.15, true));
  assert.ok(diffusivity(1373.15) > diffusivity(1273.15));
});
test('Gaussian conserved dose and erfc supplied dose by independent refined quadrature', () => {
  for (const profile of ['gaussian', 'erfc'] as const)
    for (const diffTime of [300, 3600, 10800]) {
      const r = { ...defaults, profile, diffTime },
        limit = 14 * Math.sqrt(diffusivity(r.diffT) * diffTime);
      for (const n of [1000, 2000]) {
        let dose = 0;
        for (let i = 0; i < n; i++) dose += (concentration(((i + 0.5) * limit) / n, r) * limit) / n;
        close(dose, profileDose(r), 1e-5);
      }
      if (profile === 'gaussian') close(profileDose(r), r.dose);
    }
  const a = { ...defaults, profile: 'gaussian' as const };
  close(concentration(0, { ...a, diffTime: a.diffTime * 4 }), concentration(0, a) / 2);
});
test('Junction is a net-doping zero, no-crossing exposed, exposure threshold limits', () => {
  for (const profile of ['gaussian', 'erfc'] as const) {
    const r = { ...defaults, profile },
      j = junctionDepth(r)!;
    close(concentration(j, r), r.acceptor, 2e-7);
    assert.ok(concentration(j * 0.9, r) > r.acceptor);
    assert.ok(concentration(j * 1.1, r) < r.acceptor);
  }
  assert.equal(junctionDepth({ ...defaults, surface: defaults.acceptor / 2 }), null);
  assert.ok(aerial(10e-6, 10e-6, 'diffusion', defaults) > 0.99);
  assert.ok(aerial(20e-6, 10e-6, 'diffusion', defaults) < 1e-6);
  close(aerial(10e-6, 10e-6, 'diffusion', { ...defaults, exposure: 0.3 }), 0.3, 1e-5);
});
test('Reproducible independent snapshots, silicon consumption and ideal lift-off', () => {
  const a = simulateRecipe(defaults, 80),
    b = simulateRecipe(defaults, 80);
  assert.deepEqual(a, b);
  assert.equal(a.length, 26);
  assert.equal(a[0].oxide[0], 0);
  assert.ok(a[1].oxide[0] > 0);
  close(a[1].recess[0], 0.4407 * a[1].oxide[0]);
  assert.equal(
    a[23].metal.reduce((x, y) => x + y, 0),
    80 * 40,
  );
  assert.ok(a[24].metal.reduce((x, y) => x + y, 0) < 80 * 40);
  assert.equal(a[24].resist.some(Boolean), false);
  a[25].oxide[0] = 99;
  assert.notEqual(a[24].oxide[0], 99);
  const payload = exportRecipe(defaults, b, 25);
  assert.equal(payload.snapshots.length, 26);
  assert.equal(payload.profile.length, 401);
  assert.ok(JSON.stringify(payload).includes('silicon-atlas-fabrication-v1'));
});
test('Nominal four terminals and consequential unopened, offset, and exposure faults', () => {
  let r = structuredClone(defaults),
    a = simulateRecipe(r),
    m = inspect(a[25], r);
  assert.ok(m.sourceContact && m.drainContact && m.gateInsulated && m.substrateContact);
  r = { ...defaults, contactEtch: 0 };
  m = inspect(simulateRecipe(r)[25], r);
  assert.ok(!m.sourceContact && !m.drainContact && !m.substrateContact);
  r = structuredClone(defaults);
  r.alignment.contact = [6e-6, 0];
  m = inspect(simulateRecipe(r)[25], r);
  assert.ok(!m.sourceContact || !m.drainContact);
  assert.ok(!m.gateInsulated);
  r = { ...defaults, exposure: 0.35 };
  a = simulateRecipe(r);
  assert.ok(!a[7].doped.some(Boolean));
  assert.equal(inspect(a[25], r).junction, null);
});
test('Etch limits and lateral-grid refinement resolve undercut', () => {
  const r = { ...defaults, etch: 'anisotropic' as const },
    a = simulateRecipe(r, 80),
    old = a[4].oxide.slice();
  etchOxide(a[4], 0, 'isotropic');
  assert.deepEqual(a[4].oxide, old);
  const opening = (s: ReturnType<typeof simulateRecipe>[number]) => {
    const row = Math.floor(s.ny / 2);
    let n = 0;
    for (let x = 0; x < s.nx; x++) if (s.oxide[row * s.nx + x] === 0) n++;
    return (n * width) / s.nx;
  };
  const vertical = opening(a[5]),
    iso = opening(simulateRecipe(defaults, 80)[5]);
  assert.ok(iso > vertical);
  const widths = [80, 160, 320].map((n) => opening(simulateRecipe(defaults, n)[5]));
  assert.ok(Math.abs(widths[2] - widths[1]) <= (width / 160) * 4);
  assert.ok(height > 0);
});
