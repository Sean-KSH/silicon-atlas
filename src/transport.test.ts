import { test } from 'node:test';
import { strict as A } from 'node:assert';
import {
  simulateTransport,
  TransportConfig,
  packetSigma,
  packetPeak,
  barLength,
  moments,
  transportFlux,
  transportRows,
} from './transport';
const base: TransportConfig = {
  species: 'electron',
  mobility: 0.05,
  diffusion: 0.001,
  field: 0,
  lifetime: Infinity,
  generation: 0,
  boundary: 'reflecting',
  initial: 'packet',
  center: barLength / 2,
  cells: 200,
  duration: 50e-9,
  frames: 1,
};
const near = (a: number, b: number, t = 1e-6) =>
  A.ok(Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300) < t, `${a} != ${b}`);
test('Gaussian diffusion: variance sigma²+2Dt, preserved center and count', () => {
  const s = simulateTransport(base),
    f = s.frames.at(-1)!,
    m = moments(f);
  near(m.mean, base.center);
  near(m.variance, packetSigma ** 2 + 2 * base.diffusion * base.duration, 1e-6);
  near(f.number, s.initialNumber);
});
test('Signed drift displacement; upwind grid convergence reduces artificial spreading', () => {
  let errors: number[] = [];
  for (const cells of [100, 200, 400]) {
    const c = { ...base, cells, diffusion: 0, field: 1000 },
      s = simulateTransport(c),
      f = s.frames.at(-1)!,
      m = moments(f);
    near(m.mean, c.center + s.velocity * c.duration, 1e-7);
    errors.push(Math.abs(m.variance - packetSigma ** 2));
  }
  A.ok(errors[1] < errors[0] && errors[2] < errors[1]);
});
test('Uniform decay and steady uniform generation with time-step convergence', () => {
  let errors: number[] = [];
  for (const timeFactor of [1, 0.5, 0.25]) {
    const c = {
        ...base,
        initial: 'uniform' as const,
        lifetime: 0.2e-6,
        duration: 0.4e-6,
        timeFactor,
      },
      s = simulateTransport(c),
      f = s.frames.at(-1)!;
    errors.push(Math.abs(f.u[0] - packetPeak * Math.exp(-2)));
    near(f.u[0], packetPeak * Math.exp(-2), 0.006);
    near(f.number + s.frames.at(-1)!.recombined, s.initialNumber);
  }
  A.ok(errors[2] < errors[1] && errors[1] < errors[0]);
  const c = {
      ...base,
      initial: 'empty' as const,
      generation: 1e25,
      lifetime: 0.2e-6,
      duration: 2e-6,
    },
    s = simulateTransport(c);
  near(s.frames.at(-1)!.u[0], c.generation * c.lifetime, 1e-4);
});
test('Boundary, source and recombination number balance for all boundaries and signs', () => {
  for (const boundary of ['absorbing', 'reflecting', 'periodic'] as const)
    for (const field of [-1500, 1500]) {
      const c = {
          ...base,
          boundary,
          field,
          center: 40e-6,
          duration: 0.8e-6,
          generation: 1e25,
          lifetime: 0.3e-6,
          frames: 8,
        },
        s = simulateTransport(c);
      for (const f of s.frames)
        A.ok(Math.abs(f.balance) / Math.max(s.initialNumber + f.generated, 1) < 1e-10);
      const end = s.frames.at(-1)!,
        F = transportFlux(end.u, c);
      if (boundary === 'reflecting') {
        A.equal(F[0], 0);
        A.equal(F.at(-1), 0);
      }
      if (boundary === 'periodic') near(F[0], F.at(-1)!);
    }
});
test('Combined drift-diffusion profile converges toward analytic Gaussian', () => {
  let errors: number[] = [];
  for (const cells of [100, 200, 400]) {
    const c = { ...base, cells, field: 600, duration: 0.1e-6 },
      s = simulateTransport(c),
      f = s.frames.at(-1)!,
      variance = packetSigma ** 2 + 2 * c.diffusion * c.duration,
      center = c.center + s.velocity * c.duration;
    let err = 0,
      norm = 0;
    f.u.forEach((u, i) => {
      const x = ((i + 0.5) * barLength) / cells,
        exact =
          ((packetPeak * packetSigma) / Math.sqrt(variance)) *
          Math.exp(-((x - center) ** 2) / (2 * variance));
      err += Math.abs(u - exact);
      norm += exact;
    });
    errors.push(err / norm);
  }
  A.ok(errors[2] < errors[1] && errors[1] < errors[0]);
  A.ok(errors[2] < 0.02);
});
test('Conventional electron current opposes particle flux and holes agree', () => {
  for (const species of ['electron', 'hole'] as const) {
    const c = { ...base, species, field: 300 },
      s = simulateTransport(c),
      r = transportRows(s.frames[0], c)[100];
    A.ok(r.jn * r.gn < 0);
    A.ok(r.jp * r.gp > 0);
    near(r.jtotal, r.jn + r.jp);
  }
});
