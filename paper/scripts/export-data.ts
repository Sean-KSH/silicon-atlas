/**
 * Exports the data behind every figure and table in the paper, computed by the same TypeScript
 * physics kernels that run in the browser. paper/scripts/make_figures.py then recomputes each
 * reference result independently with NumPy/SciPy, reports the error and draws the figures.
 *
 *   pnpm paper:data      (writes paper/data/*.json)
 *   pnpm paper:figures   (reads them, writes paper/figures/* and paper/data/summary.json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solid, average, inventory } from '../../src/segregation';
import { wellEnergy, transmission, band, hbar, m0, qe } from '../../src/atomicPhysics';
import { solveEquilibrium, fermiHalf } from '../../src/equilibrium';
import {
  simulateTransport,
  moments,
  barLength,
  packetSigma,
  type TransportConfig,
} from '../../src/transport';
import {
  oxideGrowth,
  oxideRates,
  concentration,
  profileDose,
  defaults,
  diffusivity,
} from '../../src/fabrication';
import { depletion, depletionAt, poissonBoltzmann, junctionDefault } from '../../src/junction';
import { solve as neamenSolve } from '../../src/physics';
import { solveDiode, diodeDefault, diodeParameters } from '../../src/diode';
import { mosDefault, mosParams, capacitor, transistor } from '../../src/mos';
import { opticalDefault, optical, solar } from '../../src/photonics';
import { benchDefaults, ring, resistorBench, fetBench } from '../../src/bench';
import { SILICON, intrinsicDensity, EPS0, Q, KB } from '../../src/materials';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
mkdirSync(OUT, { recursive: true });
const write = (name: string, data: unknown) => {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data));
  console.log('  data', name);
};
const lin = (a: number, b: number, n: number) =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

// 01 Scheil segregation
{
  const f = lin(0, 0.995, 200);
  const curves = [0.1, 0.5, 1, 2].map((k) => ({ k, cs: f.map((x) => solid(1e-6, k, x)) }));
  const intervals = [
    [0, 0.5],
    [0.2, 0.8],
    [0.5, 0.95],
    [0, 0.99],
  ].flatMap(([a, b]) =>
    [0.01, 0.1, 0.5, 1, 2, 5].map((k) => ({
      k,
      a,
      b,
      average: average(1e-6, k, a, b),
      inventory: inventory(1e-6, k, a, b),
    })),
  );
  write('scheil', { c0: 1e-6, f, curves, intervals });
}

// 02 Quantum well and barrier
{
  const m = m0,
    L = 5e-9;
  const levels = [1, 2, 3, 4, 5].map((n) => ({ n, E: wellEnergy(n, L, m) }));
  const V = 1 * qe,
    d = 1e-9;
  const E = lin(0.02, 3, 300).map((x) => x * qe);
  const T = E.map((e) => transmission(e, V, d, m));
  const widths = lin(0.1e-9, 2e-9, 60);
  const Tw = widths.map((w) => transmission(0.3 * qe, V, w, m));
  const a = 0.5e-9,
    t = 0.3 * qe;
  const k = lin(-Math.PI / a, Math.PI / a, 201);
  const bands = k.map((kk) => band(kk, t, a).energy);
  write('quantum', { m, L, levels, V, d, E, T, widths, Tw, hbar, a, t, k, bands });
}

// 03 Equilibrium carriers versus temperature
{
  const T = lin(40, 800, 120);
  const run = (statistics: 'MB' | 'FD', donors: number) =>
    T.map((temperature) => {
      const s = solveEquilibrium({ material: 'Si', temperature, donors, acceptors: 0, statistics });
      return { n: s.n, p: s.p, ni: s.ni, ef: s.ef, ec: s.ec };
    });
  const eta = lin(-10, 20, 61);
  write('equilibrium', {
    T,
    donors: 1e21,
    mb: run('MB', 1e21),
    fd: run('FD', 1e21),
    fermi: eta.map((e) => ({ eta: e, f128: fermiHalf(e, 128), f512: fermiHalf(e, 512) })),
    ni300: intrinsicDensity(SILICON, 300),
    nc300: SILICON.nc300,
    nv300: SILICON.nv300,
    gap: SILICON.gapEv,
  });
}

// 04 Transport: diffusion variance and grid refinement, drift displacement, decay
{
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
    duration: 200e-9,
    frames: 20,
  };
  const diffusion = [100, 200, 400].map((cells) => {
    const s = simulateTransport({ ...base, cells });
    return {
      cells,
      t: s.frames.map((f) => f.time),
      variance: s.frames.map((f) => moments(f).variance),
    };
  });
  const drift = [100, 200, 400, 800].map((cells) => {
    const c = { ...base, cells, diffusion: 0, field: 1000, duration: 500e-9, frames: 1 };
    const s = simulateTransport(c);
    const m = moments(s.frames.at(-1)!);
    return { cells, mean: m.mean, variance: m.variance };
  });
  const decayCfg = {
    ...base,
    initial: 'uniform' as const,
    diffusion: 0,
    lifetime: 0.5e-6,
    duration: 2e-6,
    frames: 40,
  };
  const decay = simulateTransport(decayCfg);
  write('transport', {
    sigma0: packetSigma,
    D: base.diffusion,
    mobility: base.mobility,
    diffusion,
    drift,
    driftField: 1000,
    driftTime: 500e-9,
    center: base.center,
    decay: {
      tau: decayCfg.lifetime,
      t: decay.frames.map((f) => f.time),
      number: decay.frames.map((f) => f.number),
      n0: decay.initialNumber,
    },
  });
}

// 05 Oxidation and diffusion
{
  const t = lin(0, 4 * 3600, 120);
  const cases = [
    { T: 1273.15, wet: true },
    { T: 1273.15, wet: false },
    { T: 1373.15, wet: true },
  ].map((c) => ({
    ...c,
    ...oxideRates(c.T, c.wet),
    x: t.map((s) => oxideGrowth(0, s, c.T, c.wet)),
  }));
  const composition = cases.map((c) => {
    const x1 = oxideGrowth(0, 3600, c.T, c.wet),
      x2 = oxideGrowth(x1, 3600, c.T, c.wet),
      direct = oxideGrowth(0, 7200, c.T, c.wet);
    return { T: c.T, wet: c.wet, twoSteps: x2, direct };
  });
  const z = lin(0, 3e-6, 400);
  const profiles = (['gaussian', 'erfc'] as const).map((profile) => {
    const r = { ...defaults, profile };
    return {
      profile,
      z,
      c: z.map((zz) => concentration(zz, r)),
      dose: profileDose(r),
      dt: diffusivity(r.diffT) * r.diffTime,
      surface: r.surface,
      doseIn: r.dose,
      acceptor: r.acceptor,
    };
  });
  write('fabrication', { t, cases, composition, profiles });
}

// 06 Junction: depletion versus Poisson-Boltzmann, refinement, Neamen examples
{
  const c = { ...junctionDefault };
  const s = depletion(c);
  const x = lin(-0.6e-6, 1.6e-6, 600);
  const dep = x.map((xx) => depletionAt(s, xx));
  const pb = poissonBoltzmann(c, 320);
  const refine = [40, 80, 160, 320, 640, 1280].map((cells) => {
    const r = poissonBoltzmann(c, cells);
    const peak = Math.max(...r.rows.map((row) => Math.abs(row.field)));
    return {
      cells,
      peak,
      gaussError: r.gaussError,
      iterations: r.iterations,
      residual: r.residual,
      charge: r.charge,
      absoluteCharge: r.absoluteCharge,
    };
  });
  const reverse = lin(0, 5, 26).map((vr) => {
    const d = depletion({ ...c, voltage: -vr });
    return { vr, w: d.w, cap: d.cap };
  });
  const neamen = {
    zero: neamenSolve({ na: 1e22, nd: 1e21, va: 0 }),
    rev5: neamenSolve({ na: 1e22, nd: 1e21, va: -5 }),
  };
  write('junction', {
    input: c,
    vbi: s.vbi,
    w: s.w,
    xp: s.xp,
    xn: s.xn,
    peak: s.peak,
    cap: s.cap,
    ni: s.ni,
    epsilon: s.epsilon,
    vt: s.vt,
    x,
    depField: dep.map((d) => d.field),
    depPhi: dep.map((d) => d.phi),
    pb: pb.rows.map((r) => ({ x: r.x, field: r.field, phi: r.phi, rho: r.rho, n: r.n, p: r.p })),
    pbStats: {
      iterations: pb.iterations,
      residual: pb.residual,
      gaussError: pb.gaussError,
      potentialDrop: pb.potentialDrop,
    },
    refine,
    reverse,
    neamen,
  });
}

// 07 Diode
{
  const c = { ...diodeDefault };
  const p = diodeParameters(c);
  const v = lin(0.05, Math.min(0.62, p.maxBias - 0.005), 60);
  const iv = (area: number) => v.map((b) => solveDiode({ ...c, area, bias: b }).total);
  write('diode', {
    input: c,
    params: {
      ni: p.ni,
      dn: p.dn,
      dp: p.dp,
      ln: p.ln,
      lp: p.lp,
      is: p.is,
      vt: p.vt,
      tauCharge: p.tauCharge,
      maxBias: p.maxBias,
    },
    v,
    i1: iv(c.area),
    i2: iv(2 * c.area),
  });
}

// 08 MOS capacitor and MOSFET
{
  const c = { ...mosDefault };
  const p = mosParams(c);
  const vg = lin(-3, 3, 241);
  const cv = vg.map((g) => {
    const a = capacitor({ ...c, vg: g });
    return { vg: g, psi: a.psi, qs: a.qs, cqs: a.cqs, chf: a.chf };
  });
  const vds = lin(0, 5, 101);
  const output = [1.5, 2.0, 2.5, 3.0].map((vgs) => ({
    vgs,
    id: vds.map((d) => transistor({ ...c, vgs, vds: d }).id),
  }));
  write('mos', {
    input: c,
    params: {
      cox: p.cox,
      eps: p.eps,
      vfb: (p as { vfb?: number }).vfb,
      phi: p.phi,
      vt: p.vt,
      major: p.major,
      minor: p.minor,
      theta: p.theta,
      gamma: p.gamma,
    },
    cv,
    vds,
    output,
  });
}

// 09 Solar cell
{
  const c = { ...opticalDefault };
  const a = optical(c),
    s = solar(c);
  const v = lin(0, s.voc, 200);
  write('solar', {
    iph: a.iph,
    is: a.is,
    vt: a.vt,
    voc: s.voc,
    isc: s.isc,
    mpp: s.mpp,
    ff: s.ff,
    absorbed: a.absorbed,
    pin: a.pin,
    v,
    i: v.map((x) => s.at(x).i),
    balance: s.balance,
  });
}

// 10 Measurement bench
{
  const c = { ...benchDefaults, probe: 'ideal' as const };
  const runs = [1, 2, 4].map((refine) => {
    const r = ring(c, refine);
    return {
      refine,
      frequency: r.frequency,
      edgeDelay: r.edgeDelay,
      delayFromRing: r.delayFromRing,
      predicted: r.predicted,
      dt: r.dt,
    };
  });
  const probes = (['ideal', 'buffer', 'direct'] as const).map((probe) => ({
    probe,
    frequency: ring({ ...benchDefaults, probe }).frequency,
  }));
  const res = resistorBench(benchDefaults);
  const fet = fetBench(benchDefaults);
  write('bench', { runs, probes, resistor: res, fet });
}

// Shared constants (for the parameter table)
write('materials', {
  si: SILICON,
  eps0: EPS0,
  q: Q,
  kb: KB,
  ni300: intrinsicDensity(SILICON, 300),
});
