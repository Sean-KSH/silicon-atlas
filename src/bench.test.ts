import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  benchDefaults as c,
  resistorBench,
  fetBench,
  inverterDC,
  inverterCurrents,
  inverterTransient,
  stageDelay,
  ring,
  nodeCap,
  measure,
  opticalBench,
  receiver,
} from './bench';
const close = (a: number, b: number, t = 1e-7) =>
  assert.ok(Math.abs(a - b) <= t * Math.max(Math.abs(b), 1e-25), `${a} != ${b}`);
test('Resistor geometry regression recovers sheet and per-contact resistance', () => {
  for (const metal of [false, true])
    for (const contact of [false, true]) {
      const r = resistorBench({ ...c, metal, contact, rc: 30 });
      close(r.extracted, r.sheet);
      assert.ok(Math.abs(r.contactEstimate - (contact ? 30 : 0)) < 1e-7);
    }
});
test('FET extraction recovers threshold/mobility with finite-VDS correction in both methods', () => {
  for (const method of ['linear', 'sqrt'] as const)
    for (const fetL of [25e-6, 50e-6, 200e-6]) {
      const r = fetBench({ ...c, method, fetL });
      assert.ok(r.extracted);
      close(r.extracted.vt, c.vt);
      close(r.extracted.mobility, c.mobility);
    }
  assert.equal(fetBench({ ...c, fitMin: 1 }).extracted, null);
});
test('Synthetic instrument errors are seeded, finite and leave reference unchanged', () => {
  const n = { ...c, noise: true, resolution: true };
  assert.equal(measure(0.01, n, 4, 'I'), measure(0.01, n, 4, 'I'));
  assert.notEqual(measure(0.01, n, 4, 'I'), measure(0.01, { ...n, seed: 309 }, 4, 'I'));
  close(measure(0.01, c, 4, 'I'), 0.01);
  const a = resistorBench(c),
    b = resistorBench(n);
  close(a.rows[50].reference, b.rows[50].reference);
});
test('nMOS load loses a threshold/body drop and consumes static low-output power; CMOS approaches rails', () => {
  const nHi = inverterDC(c, 0),
    nLo = inverterDC(c, 10);
  assert.ok(nHi.v < 8 && nHi.v > 5);
  assert.ok(nLo.v < 1 && nLo.power > 0);
  const p = { ...c, topology: 'cmos' as const, ratio: 5 };
  assert.ok(inverterDC(p, 0).v > 9.999);
  assert.ok(inverterDC(p, 10).v < 1e-8);
  assert.ok(inverterDC(p, 0).power < 2e-8);
  for (const input of [0, 2, 4, 8, 10]) assert.ok(Math.abs(inverterDC(c, input).net) < 1e-12);
});
test('Loaded inverter step delay converges on timestep refinement and scales with node capacitance', () => {
  const cap = nodeCap(c) + c.scopeC,
    a = stageDelay(c, cap, 1, undefined, true),
    b = stageDelay(c, cap, 2, undefined, true),
    d = stageDelay(c, cap, 4, undefined, true);
  close(b.tp, d.tp, 1e-4);
  assert.ok(Math.abs(b.tp - d.tp) <= Math.abs(a.tp - d.tp) * 1.2 + 1e-14);
  close(stageDelay(c, 2 * cap, 1, undefined, true).tp, 2 * a.tp);
  const trace = inverterTransient(c);
  assert.ok(trace.rows.every((r) => r.y[0] >= 0 && r.y[0] <= 10));
});
test('Five-stage ring has a stationary unperturbed equilibrium and convergent drive-determined frequency', () => {
  const p = { ...c, probe: 'ideal' as const };
  const still = ring({ ...p, perturb: false });
  assert.equal(still.frequency, null);
  assert.ok(still.rows.every((r) => r.y.every((v) => v === still.eq)));
  const a = ring(p),
    b = ring(p, 2);
  assert.ok(a.frequency && b.frequency && a.edgeDelay);
  close(a.frequency, b.frequency, 2e-3);
  close(a.frequency, 1 / (10 * a.edgeDelay), 0.03);
  close(a.frequency, a.predicted, 0.2);
  assert.ok(a.amplitude > 1);
});
test('Scope capacitance loads ring directly; buffered scope preserves frequency better', () => {
  const p = { ...c, scopeC: 100e-12 },
    ideal = ring({ ...p, probe: 'ideal' }),
    direct = ring({ ...p, probe: 'direct' }),
    buffer = ring({ ...p, probe: 'buffer' });
  assert.ok(ideal.frequency && direct.frequency && buffer.frequency);
  assert.ok(
    Math.abs(buffer.frequency - ideal.frequency) < Math.abs(direct.frequency - ideal.frequency),
  );
});
test('Optical bench exposes compliance and receiver RC amplitude/step convergence', () => {
  const a = opticalBench(c);
  assert.ok(a.rows.some((r) => r.compliance));
  close(a.isc, a.pv.isc);
  const low = { ...c, irradiance: 20 },
    r = receiver(low),
    fine = receiver(low, 2);
  assert.ok(r.validReverse);
  close(r.peak, r.idealAmplitude, 0.01);
  close(r.peak, fine.peak, 0.001);
});
